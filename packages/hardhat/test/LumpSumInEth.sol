// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "../contracts/LumpSumInEth.sol";
import { Test } from "forge-std/src/Test.sol";

contract LumpSumInEthTest is Test {
    address constant GIVER = address(1);
    address constant GRANTEE = address(2);
    uint16 constant DAYS_TO_MATURE = 100;
    uint256 constant TOTAL_AMOUNT = 1000;

    LumpSumInEth c;

    receive() external payable {}

    function setUp() public {
        c = new LumpSumInEth();
    }

    function makeADeposit() public returns (uint256 index){
        vm.deal(c.owner(), 0);
        vm.deal(GIVER, TOTAL_AMOUNT * 100);
        vm.prank(GIVER);
        return c.fundLumpSumGrant{value: TOTAL_AMOUNT}(GRANTEE, DAYS_TO_MATURE);
    }

    // LUMP SUM DEPOSIT

    function testCanDepositFunds() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);

        (
            bool isReleased,
            bool isRevokedBeforeMaturing,
            bool isRevokedAfterMaturing,
            ,
            ,
            ,
            uint256 amount,
            
        ) = c.escrows(index);

        assertEq(
            isReleased || isRevokedBeforeMaturing || isRevokedAfterMaturing,
            false,
            "Must be unset"
        );

        assertEq(c.owner().balance, comission, 'Comission must be sent');
        assertEq(address(c).balance, TOTAL_AMOUNT - comission, "The rest of the sum is on the contract");
        assertEq(amount, TOTAL_AMOUNT - comission, "And written in the escrow");
        assertEq(GIVER.balance, 99 * TOTAL_AMOUNT, "Funder spends");
        assertEq(GRANTEE.balance, 0, "But grantee gets nothing right away");
    }

    function testEscrowCanBeOnlyReleasedByGrantee() public {
        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.expectRevert();
        c.release(index);
        assertEq(GIVER.balance, 99 * TOTAL_AMOUNT, "Giver gets nothing in case of error");
        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, TOTAL_AMOUNT - c.calcCommission(TOTAL_AMOUNT), "Everything stays");
    }

    function testEscrowCanNotBeReleasedBeforeMaturing() public {
        uint256 index = makeADeposit();

        vm.prank(GRANTEE);
        vm.expectRevert();
        c.release(index);
        assertEq(GRANTEE.balance, 0, "Grantee gets nothing in case of error");

        (,,,,,,uint256 amount,) = c.escrows(index);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);
        assertEq(GRANTEE.balance, amount, "Grantee gets everything");
    }

    function testEscrowCanNotBeReleasedTwice() public {
        uint256 index = makeADeposit();

        (,,,,,,uint256 amount,) = c.escrows(index);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);
        assertEq(GRANTEE.balance, amount, "Grantee gets everything");

        vm.prank(GRANTEE);
        vm.expectRevert();
        c.release(index);
    }

    function testEscrowCanBeRevokedInFullBeforeTheFirstQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);

        vm.prank(GIVER);
        c.revoke(index);
        assertEq(GIVER.balance, 100 * TOTAL_AMOUNT - comission, "Revoke before the 1/4 must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");
    }

    function testEscrowCanBeRevokedInHalfBeforeTheSecondQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);
        uint256 half = (TOTAL_AMOUNT - comission) / 2;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 99 * TOTAL_AMOUNT  + half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, TOTAL_AMOUNT - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanBeRevokedInThirdBeforeTheThirdQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);
        uint256 third = (TOTAL_AMOUNT - comission) / 3;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 + 1) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 99 * TOTAL_AMOUNT  + third, "Revoke before the 3/4 must be 1/3 of the amount");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, TOTAL_AMOUNT - comission - third, "The other 2/3 stays on escrow");
    }

    function testEscrowCanBeRevokedInQuarterBeforeTheFourthQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);
        uint256 quarter = (TOTAL_AMOUNT - comission) / 4;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE - 1) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 99 * TOTAL_AMOUNT  + quarter, "Revoke before the 4/4 must be 1/4 of the amount");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, TOTAL_AMOUNT - comission - quarter, "The other 3/4 stays on escrow");
    }

    function testEscrowCanNotBeRevokedAnfterMaturingFor30Days() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.expectRevert();
        c.revoke(index);
        
        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 100 * TOTAL_AMOUNT - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceBefore() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);
        uint256 half = (TOTAL_AMOUNT - comission) / 2;
        

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 99 * TOTAL_AMOUNT  + half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, TOTAL_AMOUNT - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount, TOTAL_AMOUNT - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceAfter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 100 * TOTAL_AMOUNT - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, 0, "Nothing stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount, 0, "Nothing stays on escrow");
    }

    function testEscrowCanBeRevokedBeforeThenAfter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT);
        uint256 half = (TOTAL_AMOUNT - comission) / 2;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 99 * TOTAL_AMOUNT  + half, "Revoke before the 2/4 must be halved");

        (,,,,,,uint256 amount,) = c.escrows(index);
        assertEq(amount, TOTAL_AMOUNT - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount, TOTAL_AMOUNT - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(GIVER.balance, 100 * TOTAL_AMOUNT - comission, "Revoke after maturing + 30 days must be complete");

        (,,,,,,uint256 amount_after,) = c.escrows(index);
        assertEq(amount_after, 0, "Nothing stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(amount_after, 0, "Nothing stays on escrow");
    }
}