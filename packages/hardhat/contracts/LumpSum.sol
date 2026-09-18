//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "./ILumpSum.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

error ZeroAddress();
error NoSuchEscrow(uint256 index);
error NotTheFunder(address you, address funder);
error NotTheGrantee(address you, address grantee);
error AlreadyRevoked();
error AlreadyReleased();
error NewComissionRateIsNotSet();
error WaitMore(uint256 atLeastTill);
error NoFunds();
error Unrevokable();
error NoSuchStage(uint8 stage);
error DepositingIsDisabled();

struct LumpSumEscrow {
    bool isReleased;
    bool isRevokedBeforeMaturing;
    bool isRevokedAfterMaturing;
    uint16 daysToMature;
    address giver;
    address grantee;
    uint256 amount;
    uint256 fundedTimestamp;
}

abstract contract LumpSum is ILumpSum, Ownable {
    uint8 constant CLAIM_PERIOD_IN_DAYS = 30;

    bool public isDisabled = false;
    uint8 public comissionRatePromille = 1;
    uint8 public newComissionRatePromille;
    uint256 public newCommissionRequestTimestamp = type(uint256).max;
    LumpSumEscrow[] public escrows;

    constructor() Ownable(msg.sender) {
    }

    // GETTERS

    function getEscrowCount() public view returns (uint256 length) {
        return escrows.length;
    }

    // HELPERS

    function deposit(uint256 amount) internal virtual;
    function transfer(address from, address to, uint256 amount) internal virtual;
    function inferFullSum() internal virtual returns(uint256 amount);

    function calcMaturityStageUpperBorder(
        uint256 fundedTimestamp_,
        uint16 daysToMature_,
        MaturityStages stage
    ) public pure returns(uint256 stageBorderTimestamp) {
        if (stage == MaturityStages.FirstQuarter) {
            return fundedTimestamp_ + 1 days * uint256(daysToMature_) / 4;
        }

        if (stage == MaturityStages.SecondQuarter) {
            return fundedTimestamp_ + 1 days * uint256(daysToMature_) / 2;
        }

        if (stage == MaturityStages.ThirdQuarter) {
            return fundedTimestamp_ + 1 days * uint256(daysToMature_) * 3 / 4;
        }

        if (stage == MaturityStages.FourthQuarter) {
            return fundedTimestamp_ + 1 days * uint256(daysToMature_);
        }

        if (stage == MaturityStages.Matured) {
            return fundedTimestamp_ + 1 days * uint256(daysToMature_ + CLAIM_PERIOD_IN_DAYS);
        }

        revert NoSuchStage(uint8(stage));
    }

    function lookupMaturityStage(
        uint256 fundedTimestamp_,
        uint16 daysToMature_
    ) public view returns(MaturityStages currentStage) {
        if (block.timestamp < calcMaturityStageUpperBorder(fundedTimestamp_, daysToMature_, MaturityStages.FirstQuarter)) {
            return MaturityStages.FirstQuarter;
        } else if (block.timestamp < calcMaturityStageUpperBorder(fundedTimestamp_, daysToMature_, MaturityStages.SecondQuarter)) {
            return MaturityStages.SecondQuarter;
        } else if (block.timestamp < calcMaturityStageUpperBorder(fundedTimestamp_, daysToMature_, MaturityStages.ThirdQuarter)) {
            return MaturityStages.ThirdQuarter;
        } else if (block.timestamp < calcMaturityStageUpperBorder(fundedTimestamp_, daysToMature_, MaturityStages.FourthQuarter)) {
            return MaturityStages.FourthQuarter;
        } else if (block.timestamp < calcMaturityStageUpperBorder(fundedTimestamp_, daysToMature_, MaturityStages.Matured)) {
            return MaturityStages.Matured;
        } else {
            return MaturityStages.Unclaimed;
        }
    }

    // GUARDS

    modifier escrowExists(uint256 i) {
        require(i < escrows.length, NoSuchEscrow(i));
        _;
    }

    modifier onlyFunder(LumpSumEscrow storage escrow) {
        require(escrow.giver == msg.sender, NotTheFunder(msg.sender, escrow.giver));
        _;
    }

    modifier onlyGrantee(LumpSumEscrow storage escrow) {
        require(escrow.grantee == msg.sender, NotTheGrantee(msg.sender, escrow.grantee));
        _;
    }

    modifier notRevokedBeforeMaturing(LumpSumEscrow storage escrow) {
        require(!escrow.isRevokedBeforeMaturing, AlreadyRevoked());
        _;
    }

    modifier notRevokedAfterMaturing(LumpSumEscrow storage escrow) {
        require(!escrow.isRevokedAfterMaturing, AlreadyRevoked());
        _;
    }

    modifier notReleased(LumpSumEscrow storage escrow) {
        require(!escrow.isReleased, AlreadyReleased());
        _;
    }

    modifier hasMatured(LumpSumEscrow storage escrow) {
        require(
            lookupMaturityStage(escrow.fundedTimestamp, escrow.daysToMature) >= MaturityStages.Matured,
            WaitMore(calcMaturityStageUpperBorder(escrow.fundedTimestamp, escrow.daysToMature, MaturityStages.FourthQuarter))
        );
        _;
    }

    modifier hasFunds(LumpSumEscrow storage escrow) {
        require(escrow.amount > 0, NoFunds());
        _;
    }

    modifier operational() {
        require(!isDisabled, DepositingIsDisabled());
        _;
    }

    // CONTRACT MANAGEMENT

    function setDisabledStatus(bool status) external onlyOwner() {
        isDisabled = status;
    }

    // COMMISSION MANAGEMENT

    function planNewCommissionRate(uint8 value) external onlyOwner() {
        newComissionRatePromille = value;
        newCommissionRequestTimestamp = block.timestamp;
    }

    function adoptNewCommissionRate() external onlyOwner() {
        require(newComissionRatePromille > 0 && newCommissionRequestTimestamp < type(uint256).max, NewComissionRateIsNotSet());

        uint256 theEarliest = newCommissionRequestTimestamp + 1 days;
        require(block.timestamp > theEarliest, WaitMore(theEarliest));
        comissionRatePromille = newComissionRatePromille;

        newComissionRatePromille = 0;
        newCommissionRequestTimestamp = type(uint256).max;
    }

    function calcCommission(uint256 amount) public view returns(uint256 comission) {
        return amount * comissionRatePromille / 1000;
    }

    function netOutCommission(uint256 full_sum) internal returns(uint256 lumpsum) {
        uint256 commission = calcCommission(full_sum);
        transfer(msg.sender, owner(), commission);
        return full_sum - commission;
    }

    // LUMP SUM HELPERS

    function release(uint256 i, LumpSumEscrow storage escrow) internal {
        escrow.isReleased = true;
        emit LumpSumReleased(escrow.giver, msg.sender, i);
        transfer(address(this), msg.sender, escrow.amount);
    }

    function refund(uint256 i, LumpSumEscrow storage escrow, uint256 amount) internal virtual {
        emit LumpSumRevoked(msg.sender, escrow.grantee, i, escrow.amount, amount);
        escrow.amount -= amount;
        transfer(address(this), msg.sender, amount);
    }

    function makeFullRefund(uint256 i, LumpSumEscrow storage escrow) internal {
        refund(i, escrow, escrow.amount);
    }

    function refundUnclaimed(uint256 i, LumpSumEscrow storage escrow) internal notRevokedAfterMaturing(escrow) {
        escrow.isRevokedAfterMaturing = true;
        makeFullRefund(i, escrow);
    }

    function makeTheBeforeRefund(uint256 i, LumpSumEscrow storage escrow, MaturityStages stage) internal notRevokedBeforeMaturing(escrow) {
        escrow.isRevokedBeforeMaturing = true;
        uint256 part;
        if (stage == MaturityStages.FirstQuarter) {
            part = 1;
        } else if (stage == MaturityStages.SecondQuarter) {
            part = 2;
        } else if (stage == MaturityStages.ThirdQuarter) {
            part = 3;
        } else if (stage == MaturityStages.FourthQuarter) {
            part = 4;
        } else {
            revert NoSuchStage(uint8(stage));
        }
        refund(i, escrow, escrow.amount / part);
    }

    // LUMN SUM LIFECYCLE

    function fundLumpSumGrant(
        address grantee_,
        uint16 daysToMature_
    ) payable external operational() returns(uint256) {
        require(grantee_ != address(0), ZeroAddress());

        uint256 lumpsum = netOutCommission(inferFullSum());
        deposit(lumpsum);
        LumpSumEscrow memory escrow = LumpSumEscrow({
            isReleased: false,
            isRevokedBeforeMaturing: false,
            isRevokedAfterMaturing: false,
            daysToMature: daysToMature_,
            giver: msg.sender,
            grantee: grantee_,
            amount: lumpsum,
            fundedTimestamp: block.timestamp
        });
        escrows.push(escrow);
        uint256 i = escrows.length - 1;
        emit LumpSumDeposited(msg.sender, grantee_, i, lumpsum);
        return i;
    }

    function _revoke(uint256 i, LumpSumEscrow storage escrow) internal
        onlyFunder(escrow)
        notReleased(escrow)
        hasFunds(escrow) {
        MaturityStages stage = lookupMaturityStage(escrow.fundedTimestamp, escrow.daysToMature);

        if (
            stage == MaturityStages.FirstQuarter
            || stage == MaturityStages.SecondQuarter
            || stage == MaturityStages.ThirdQuarter
            || stage == MaturityStages.FourthQuarter
        ) {
            makeTheBeforeRefund(i, escrow, stage);
        } else if (stage == MaturityStages.Matured) {
            revert Unrevokable();
        } else {
            refundUnclaimed(i, escrow);
        }
    }

    function revoke(uint256 i) external escrowExists(i) {
        LumpSumEscrow storage escrow = escrows[i];
        _revoke(i, escrow);
    }

    function _release(uint256 i, LumpSumEscrow storage escrow) internal
        onlyGrantee(escrow)
        notReleased(escrow)
        hasMatured(escrow)
        hasFunds(escrow) {
        
        release(i, escrow);
    }

    function release(uint256 i) external escrowExists(i) {
        LumpSumEscrow storage escrow = escrows[i];
        _release(i, escrow);
    }
}