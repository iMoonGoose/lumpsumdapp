// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "../contracts/LumpSumInEth.sol";
import { Test } from "forge-std/src/Test.sol";

contract LumpSumInEthTest is Test {
    LumpSumInEth c;

    receive() external payable {}

    function setUp() public {
        c = new LumpSumInEth();
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

    // ESCROW BASICS

    function testEscrowMustExist() public {
        vm.expectRevert();
        c.release(100);
    }

    // LUMP SUM DEPOSIT

    function testCanDepositFunds() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

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

        assertEq(daysToMature, daysToMature_, "Maturity period must be the same");
        assertEq(giver, giver_, "Giver must persist");
        assertEq(grantee, grantee_, "Grantee must persist");
        assertEq(fundedTimestamp, block.timestamp, "Timestamp is of the current block");

        assertEq(c.owner().balance, comission, 'Comission must be sent');
        assertEq(address(c).balance, amount_ - comission, "The rest of the sum is on the contract");
        assertEq(amount, amount_ - comission, "And written in the escrow");
        assertEq(giver_.balance, 99 * amount_, "Funder spends");
        assertEq(grantee_.balance, 0, "But grantee gets nothing right away");
    }

    function testEscrowCanBeOnlyReleasedByGrantee() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.expectRevert();
        c.release(index);
        assertEq(giver_.balance, 99 * amount_, "Giver gets nothing in case of error");
        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, amount_ - c.calcCommission(amount_), "Everything stays");
    }

    function testEscrowCanNotBeReleasedBeforeMaturing() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(grantee_);
        vm.expectRevert();
        c.release(index);
        assertEq(grantee_.balance, 0, "Grantee gets nothing in case of error");

        (,,,,,,uint256 amount,) = c.escrows(index);
        vm.warp(block.timestamp + (daysToMature_ + 1) * 1 days);
        vm.prank(grantee_);
        c.release(index);
        assertEq(grantee_.balance, amount, "Grantee gets everything");
    }

    function testEscrowCanNotBeReleasedTwice() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        (,,,,,,uint256 amount,) = c.escrows(index);
        vm.warp(block.timestamp + (daysToMature_ + 1) * 1 days);
        vm.prank(grantee_);
        c.release(index);
        assertEq(grantee_.balance, amount, "Grantee gets everything");

        vm.prank(grantee_);
        vm.expectRevert();
        c.release(index);
    }

    function testEscrowCanBeRevokedInFullBeforeTheFirstQuarter() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        c.revoke(index);
        assertEq(giver_.balance, 100 * amount_ - comission, "Revoke before the 1/4 must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");
    }

    function testEscrowCanBeRevokedInHalfBeforeTheSecondQuarter() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;
        uint256 half = (amount_ - comission) / 2; // 499

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 99 * amount_  + half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, amount_ - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanBeRevokedInThirdBeforeTheThirdQuarter() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;
        uint256 third = (amount_ - comission) / 3; // 333

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ / 2 + 1) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 99 * amount_  + third, "Revoke before the 3/4 must be 1/3 of the amount");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, amount_ - comission - third, "The other 2/3 stays on escrow");
    }

    function testEscrowCanBeRevokedInQuarterBeforeTheFourthQuarter() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;
        uint256 quarter = (amount_ - comission) / 4; // 249

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ - 1) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 99 * amount_  + quarter, "Revoke before the 4/4 must be 1/4 of the amount");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, amount_ - comission - quarter, "The other 3/4 stays on escrow");
    }

    function testEscrowCanNotBeRevokedAnfterMaturingFor30Days() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ + 1) * 1 days);
        vm.expectRevert();
        c.revoke(index);
        
        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ + 31) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 100 * amount_ - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceBefore() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;
        uint256 half = (amount_ - comission) / 2; // 499

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 99 * amount_  + half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, amount_ - comission - half, "The other half stays on escrow");

        vm.prank(giver_);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount, amount_ - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceAfter() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ + 31) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 100 * amount_ - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");

        vm.prank(giver_);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount, 0, "Nothing stays on escrow");
    }

    function testEscrowCanBeRevokedBeforeThenAfter() public {
        address giver_ = address(1);
        address grantee_ = address(2);
        uint256 amount_ = 1000;
        uint16 daysToMature_ = 100;

        uint256 comission = amount_ * c.comissionRatePromille() / 1000;
        uint256 half = (amount_ - comission) / 2; // 499

        vm.deal(c.owner(), 0);
        vm.deal(giver_, amount_ * 100);
        vm.prank(giver_);
        uint256 index = c.fundLumpSumGrant{value: amount_}(grantee_, daysToMature_);

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 99 * amount_  + half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, amount_ - comission - half, "The other half stays on escrow");

        vm.prank(giver_);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount, amount_ - comission - half, "The other half stays on escrow");

        vm.prank(giver_);
        vm.warp(block.timestamp + (daysToMature_ + 31) * 1 days);
        c.revoke(index);
        assertEq(giver_.balance, 100 * amount_ - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount_after,) = c.escrows(index);
        assertEq(amount_after, 0, "Nothing stays on escrow");

        vm.prank(giver_);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount_after, 0, "Nothing stays on escrow");
    }
}