//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

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

enum MaturityStages {
    FirstQuarter,
    SecondQuarter,
    ThirdQuarter,
    FourthQuarter,
    Matured,
    Unclaimed
}

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

event LumpSumDeposited(address indexed giver, address indexed grantee, uint256 indexed i, uint256 depositedAmount);
event LumpSumReleased(address indexed giver, address indexed grantee, uint256 indexed i);
event LumpSumRevoked(address indexed giver, address indexed grantee, uint256 indexed i, uint256 oldAmount, uint256 revokedAmount);

contract LumpSumInEth is Ownable {
    uint8 constant CLAIM_PERIOD_IN_DAYS = 30;

    uint8 public comissionRatePromille = 1;
    uint8 public newComissionRatePromille;
    uint256 public newCommissionRequestTimestamp = type(uint256).max;
    LumpSumEscrow[] public escrows;

    constructor() Ownable(msg.sender) {
    }

    // HELPERS

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

    function netOutCommission() private returns(uint256) {
        uint256 commission = calcCommission(msg.value);
        Address.sendValue(payable(owner()), commission);
        return msg.value - commission;
    }

    // LUMP SUM HELPERS

    function release(uint256 i, LumpSumEscrow storage escrow) private {
        escrow.isReleased = true;
        emit LumpSumReleased(msg.sender, escrow.grantee, i);
        Address.sendValue(payable(msg.sender), escrow.amount);
    }

    function refund(uint256 i, LumpSumEscrow storage escrow, uint256 amount) private {
        emit LumpSumRevoked(msg.sender, escrow.grantee, i, escrow.amount, amount);
        escrow.amount -= amount;
        Address.sendValue(payable(msg.sender), amount);
    }

    function makeFullRefund(uint256 i, LumpSumEscrow storage escrow) private {
        refund(i, escrow, escrow.amount);
    }

    function refundUnclaimed(uint256 i, LumpSumEscrow storage escrow) private notRevokedAfterMaturing(escrow) {
        escrow.isRevokedAfterMaturing = true;
        makeFullRefund(i, escrow);
    }

    function refundEarly(uint256 i, LumpSumEscrow storage escrow) private notRevokedBeforeMaturing(escrow) {
        escrow.isRevokedBeforeMaturing = true;
        makeFullRefund(i, escrow);
    }

    function makePartialRefund(uint256 i, LumpSumEscrow storage escrow, uint256 part) private notRevokedBeforeMaturing(escrow) {
        escrow.isRevokedBeforeMaturing = true;
        refund(i, escrow, escrow.amount / part);
    }

    // LUMN SUM LIFECYCLE

    function fundLumpSumGrant(
        address grantee_,
        uint16 daysToMature_
    ) payable external returns(uint256) {
        require(grantee_ != address(0), ZeroAddress());

        uint256 lumpsum = netOutCommission();
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

    function _revoke(uint256 i, LumpSumEscrow storage escrow) private
        onlyFunder(escrow)
        notReleased(escrow)
        hasFunds(escrow) {
        MaturityStages stage = lookupMaturityStage(escrow.fundedTimestamp, escrow.daysToMature);

        if (stage == MaturityStages.FirstQuarter) {
            refundEarly(i, escrow);
        } else if (stage == MaturityStages.SecondQuarter) {
            makePartialRefund(i, escrow, 2);
        } else if (stage == MaturityStages.ThirdQuarter) {
            makePartialRefund(i, escrow, 3);
        } else if (stage == MaturityStages.FourthQuarter) {
            makePartialRefund(i, escrow, 4);
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

    function _release(uint256 i, LumpSumEscrow storage escrow) private
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