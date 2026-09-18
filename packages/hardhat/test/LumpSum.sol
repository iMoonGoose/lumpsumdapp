// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "../contracts/LumpSum.sol";
import { Test } from "forge-std/src/Test.sol";
import "hardhat/console.sol";

contract LumpSumTestDummy is LumpSum {
    uint256 public constant msgValue = 1000;

    uint256 public deposited;
    function deposit(uint256 amount) internal override {
        deposited += amount;
    }

    uint256 public transferAmount;
    address public transferFrom;
    address public transferTo;
    function transfer(address from, address to, uint256 amount) internal override {
        transferAmount += amount;
        transferFrom = from;
        transferTo = to;
    }

    function inferFullSum() internal pure override returns(uint256 amount){
        return msgValue;
    }

    uint256 public refundAmount;
    function refund(uint256 i, LumpSumEscrow storage escrow, uint256 amount) internal override {
        emit LumpSumRevoked(msg.sender, escrow.grantee, i, escrow.amount, amount);
        escrow.amount -= amount;
        refundAmount += amount;
        transfer(address(this), msg.sender, amount);
    }
}

contract LumpSumTest is Test {
    address constant GIVER = address(1);
    address constant GRANTEE = address(2);
    uint16 constant DAYS_TO_MATURE = 100;

    LumpSumTestDummy c;

    function setUp() public {
        c = new LumpSumTestDummy();
    }
    
    function makeADeposit() public returns (uint256 index){
        uint256 amount = c.msgValue();
        vm.deal(GIVER, amount * 100);
        vm.prank(GIVER);
        return c.fundLumpSumGrant{value: amount}(GRANTEE, DAYS_TO_MATURE);
    }

    // MATURITY STAGE CALCULATION

    function testCalcMaturityStageUpperBorder() public {
        uint256 fundedTimestamp = 1;
        uint16 daysToMature = 77;

        assertEq(c.calcMaturityStageUpperBorder(fundedTimestamp, daysToMature, MaturityStages.FirstQuarter), 1_663_201, "Border timestamp is wrong");
        assertEq(c.calcMaturityStageUpperBorder(fundedTimestamp, daysToMature, MaturityStages.SecondQuarter), 3_326_401, "Border timestamp is wrong");
        assertEq(c.calcMaturityStageUpperBorder(fundedTimestamp, daysToMature, MaturityStages.ThirdQuarter), 4_989_601, "Border timestamp is wrong");
        assertEq(c.calcMaturityStageUpperBorder(fundedTimestamp, daysToMature, MaturityStages.FourthQuarter), 6_652_801, "Border timestamp is wrong");
        assertEq(c.calcMaturityStageUpperBorder(fundedTimestamp, daysToMature, MaturityStages.Matured), 9_244_801, "Border timestamp is wrong");
        vm.expectRevert();
        c.calcMaturityStageUpperBorder(fundedTimestamp, daysToMature, MaturityStages.Unclaimed);
    }

    function testLookupMaturityStage() public {
        uint256 fundedTimestamp = 1;
        uint16 daysToMature = 77;

        vm.warp(15);
        assertEq(uint8(c.lookupMaturityStage(fundedTimestamp, daysToMature)), uint8(MaturityStages.FirstQuarter), "Border timestamp is wrong");
        vm.warp(3_000_000);
        assertEq(uint8(c.lookupMaturityStage(fundedTimestamp, daysToMature)), uint8(MaturityStages.SecondQuarter), "Border timestamp is wrong");
        vm.warp(4_500_000);
        assertEq(uint8(c.lookupMaturityStage(fundedTimestamp, daysToMature)), uint8(MaturityStages.ThirdQuarter), "Border timestamp is wrong");
        vm.warp(6_600_000);
        assertEq(uint8(c.lookupMaturityStage(fundedTimestamp, daysToMature)), uint8(MaturityStages.FourthQuarter), "Border timestamp is wrong");
        vm.warp(9_244_800);
        assertEq(uint8(c.lookupMaturityStage(fundedTimestamp, daysToMature)), uint8(MaturityStages.Matured), "Border timestamp is wrong");
        vm.warp(9_244_801);
        assertEq(uint8(c.lookupMaturityStage(fundedTimestamp, daysToMature)), uint8(MaturityStages.Unclaimed), "Border timestamp is wrong");
    }

    // COMISSION MANAGEMENT

    function testComissionRatePromilleGetter() public view {
        assertEq(c.comissionRatePromille(), 1, "Commission promille is not OK");
    }

    function testCommisionChangeIsForTheOwnerOnly() public {
        // works
        uint8 startCommisionRate = c.comissionRatePromille();
        c.planNewCommissionRate(startCommisionRate);
        //fails
        vm.prank(address(1));
        vm.expectRevert();
        c.planNewCommissionRate(startCommisionRate);
    }

    function testFirstChangeComissionThenAdopt() public {
        //fails
        vm.expectRevert();
        c.adoptNewCommissionRate();
    }

    function testCanChangeComissionOnlyAfterWaitingADay() public {
        uint8 newCommisionRate = c.comissionRatePromille() + 66;
        //fails
        c.planNewCommissionRate(newCommisionRate);
        vm.expectRevert();
        c.adoptNewCommissionRate();
         assertEq(c.comissionRatePromille(), newCommisionRate - 66, "Current commission promille must not change");
    }

    function testPlannedComissionDoesNotChangeTheCurrentOne() public {
        uint8 startCommisionRate = c.comissionRatePromille();
        uint8 newCommisionRate = c.newComissionRatePromille() + 23;

        assertEq(c.newComissionRatePromille(), 0, "New commmision promille starts at 0");
        c.planNewCommissionRate(newCommisionRate);
        assertEq(c.newComissionRatePromille(), newCommisionRate, "Requested commision promille must change");
        assertEq(c.comissionRatePromille(), startCommisionRate, "Current commission promille must not change");
    }

    function testAdoptingNewComissionRate() public {
        uint8 newCommisionRate = c.comissionRatePromille() + 42;
        c.planNewCommissionRate(newCommisionRate);
        vm.warp(block.timestamp + 2 days);
        c.adoptNewCommissionRate();
        assertEq(c.comissionRatePromille(), newCommisionRate, "New value must be set");
    }

    // COMMISION CALCULATION

    function quicklySetNewRate(uint8 rate) private {
        c.planNewCommissionRate(rate);
        vm.warp(block.timestamp + 2 days);
        c.adoptNewCommissionRate();
    }

    function testCalcCommission() public {
        quicklySetNewRate(3);
        assertEq(c.calcCommission(0), 0, "Commision value is wrong");
        assertEq(c.calcCommission(333), 0, "Commision value is wrong");
        assertEq(c.calcCommission(334), 1, "Commision value is wrong");
        assertEq(c.calcCommission(1000), 3, "Commision value is wrong");
        assertEq(c.calcCommission(1234_000_000_230), 3_702_000_000, "Commision value is wrong");
        assertEq(c.calcCommission(1.2 ether), 3.6e15, "Commision value is wrong");
    }

    // CONTRACT MANAGEMENT

    function testContractStartsEnabled() public view {
        assertEq(c.isDisabled(), false, "Contract must start ready");
    }

    function testDisablingIsGuarded() public {
        vm.prank(GIVER);
        vm.expectRevert();
        c.setDisabledStatus(true);

        vm.prank(c.owner());
        c.setDisabledStatus(true);
        assertEq(c.isDisabled(), true, "Contract must become disabled");
    }

    function testDisablingPreventsDepositing() public {
        assertEq(c.getEscrowCount(), 0, "No escrows at the begining");
        makeADeposit();
        assertEq(c.getEscrowCount(), 1, "Deposited successfully");

        vm.prank(c.owner());
        c.setDisabledStatus(true);

        vm.prank(GIVER);
        vm.expectRevert();
        c.fundLumpSumGrant{value: 1}(GRANTEE, DAYS_TO_MATURE);
        assertEq(c.getEscrowCount(), 1, "Depositing prevented");
    }

    function testDisablingDoesNotPreventRevoking() public {
        uint256 index = makeADeposit();

        vm.prank(c.owner());
        c.setDisabledStatus(true);

        vm.prank(GIVER);
        c.revoke(index);
        assertEq(c.refundAmount() > 0, true, "Revoke must occur dispite the contract being disabled");
    }

    function testDisablingDoesNotPreventReleasing() public {
        uint256 index = makeADeposit();

        vm.prank(c.owner());
        c.setDisabledStatus(true);

        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);
        assertEq(c.transferAmount(), c.msgValue(), "Release must occur dispite the contract being disabled");
    }

    // ESCROW BASICS

    function testEscrowMustExist() public {
        vm.expectRevert();
        c.release(100);
    }

    // LUMP SUM DEPOSIT

    function testCanDepositFunds() public {
        uint256 index = makeADeposit();

        (
            bool isReleased,
            bool isRevokedBeforeMaturing,
            bool isRevokedAfterMaturing,
            uint16 daysToMature,
            address giver,
            address grantee,
            uint256 amount,
            uint256 fundedTimestamp
        ) = c.escrows(index);

        assertEq(
            isReleased || isRevokedBeforeMaturing || isRevokedAfterMaturing,
            false,
            "Must be unset"
        );

        uint256 lumpsum = c.msgValue() - c.calcCommission(c.msgValue());

        assertEq(c.deposited(), lumpsum, "A,ount must be deposited");
        assertEq(amount, lumpsum, "Amount must be correct");
        assertEq(daysToMature, DAYS_TO_MATURE, "Maturity period must be the same");
        assertEq(giver, GIVER, "Giver must persist");
        assertEq(grantee, GRANTEE, "Grantee must persist");
        assertEq(fundedTimestamp, block.timestamp, "Timestamp is of the current block");
    }

    function testEscrowCanBeOnlyReleasedByGrantee() public {
        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.expectRevert();
        c.release(index);
        (bool isReleased,,,,,,,) = c.escrows(index);
        assertEq(isReleased, false, "Release must not occur");
    }

    function testEscrowCanNotBeReleasedBeforeMaturing() public {
        uint256 index = makeADeposit();

        vm.prank(GRANTEE);
        vm.expectRevert();
        c.release(index);

        (bool isReleased,,,,,,,) = c.escrows(index);
        assertEq(isReleased, false, "Release must not occur");

        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);

        (isReleased,,,,,,,) = c.escrows(index);
        assertEq(isReleased, true, "Release must occur");
    }

    function testEscrowCanNotBeReleasedTwice() public {
        uint256 index = makeADeposit();

        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);

        (bool isReleased,,,,,,,) = c.escrows(index);
        assertEq(isReleased, true, "Release must occur");

        vm.prank(GRANTEE);
        vm.expectRevert();
        c.release(index);
    }

    function testEscrowCanBeRevokedInFullBeforeTheFirstQuarter() public {
        uint256 index = makeADeposit();

        vm.prank(GIVER);
        c.revoke(index);
        (
            ,
            bool isRevokedBeforeMaturing,
            ,
            ,
            ,
            ,
            uint256 amount,
            
        ) = c.escrows(index);
        assertEq(isRevokedBeforeMaturing, true, "Revoke must be logged");
        assertEq(amount, 0, "Refund must be complete, not partial");
        assertEq(c.refundAmount(), c.msgValue() - c.calcCommission(c.msgValue()), "Refund must be complete, not partial");
    }

    function testEscrowCanBeRevokedInHalfBeforeTheSecondQuarter() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 half = (c.msgValue() - comission) / 2; // 499

        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, c.msgValue() - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanBeRevokedInThirdBeforeTheThirdQuarter() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 third = (c.msgValue() - comission) / 3; // 333

        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 + 1) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), third, "Revoke before the 3/4 must be 1/3 of the amount");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, c.msgValue() - comission - third, "The other 2/3 stays on escrow");
    }

    function testEscrowCanBeRevokedInQuarterBeforeTheFourthQuarter() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 quarter = (c.msgValue() - comission) / 4; // 249

        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE - 1) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), quarter, "Revoke before the 4/4 must be 1/4 of the amount");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, c.msgValue() - comission - quarter, "The other 3/4 stays on escrow");
    }

    function testEscrowCanNotBeRevokedAnfterMaturingFor30Days() public {
        uint256 comission = c.calcCommission(c.msgValue());

        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.expectRevert();
        c.revoke(index);
        
        assertEq(c.refundAmount(), 0, "No revoke after maturing");

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), c.msgValue() - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceBefore() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 half = (c.msgValue() - comission) / 2; // 499

        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, c.msgValue() - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        (,,,,,,amount,) = c.escrows(index);
        assertEq(amount, c.msgValue() - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceAfter() public {
        uint256 comission = c.calcCommission(c.msgValue());

        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), c.msgValue() - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        (,,,,,, amount,) = c.escrows(index);
        assertEq(amount, 0, "Escrow can not dip below zero");
        assertEq(c.refundAmount(), c.msgValue() - comission, "Refund amount is not doubled");
    }

    function testEscrowCanBeRevokedBeforeThenAfter() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 half = (c.msgValue() - comission) / 2; // 499

        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, c.msgValue() - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        (,,,,,,amount,) = c.escrows(index);
        assertEq(amount, c.msgValue() - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(c.refundAmount(), c.msgValue() - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        (,,,,,, amount,) = c.escrows(index);
        assertEq(amount, 0, "Escrow can not dip below zero");
        assertEq(c.refundAmount(), c.msgValue() - comission, "Refund amount is not doubled");
    }

    // EVENTS

    function testFundingAnEscrowEmitsAnEvent() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 lumpsum = (c.msgValue() - comission);
        vm.expectEmit(true, true, true, true, address(c));
        emit LumpSumDeposited(GIVER, GRANTEE, 0, lumpsum);
        uint256 index = makeADeposit();
    }

    function testRevokingAnEscrowEmitsAnEvent() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 lumpsum = (c.msgValue() - comission);

        uint256 index = makeADeposit();

        vm.expectEmit(true, true, true, true, address(c));
        emit LumpSumRevoked(GIVER, GRANTEE, 0, lumpsum, lumpsum);
        vm.prank(GIVER);
        c.revoke(index);
    }

    function testReleasingAnEscrowEmitsAnEvent() public {
        uint256 comission = c.calcCommission(c.msgValue());
        uint256 lumpsum = (c.msgValue() - comission);

        uint256 index = makeADeposit();

        vm.expectEmit(true, true, true, false, address(c));
        emit LumpSumReleased(GIVER, GRANTEE, 0);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);
    }
}