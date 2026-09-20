// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "../contracts/LumpSumInERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Test } from "forge-std/src/Test.sol";

contract ERC20Instance is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address account, uint256 value) external {
        _mint(account, value);
    }
}

contract LumpSumInERC20Test is Test {
    address constant GIVER = address(1);
    address constant GRANTEE = address(2);
    uint16 constant DAYS_TO_MATURE = 100;
    uint256 constant TOTAL_AMOUNT = 1010;
    uint256 constant TOTAL_AMOUNT_MINUS_1 = 1009;

    ERC20Instance t;
    LumpSumInERC20 c;

    function setUp() public {
        t = new ERC20Instance("A", "a");
        t.mint(GIVER, 99 * TOTAL_AMOUNT + TOTAL_AMOUNT_MINUS_1);
        c = new LumpSumInERC20(address(t));
    }

    function makeADeposit() public returns (uint256 index){
        vm.prank(GIVER);
        t.approve(address(c), TOTAL_AMOUNT);
        vm.prank(GIVER);
        return c.fundLumpSumGrant(GRANTEE, DAYS_TO_MATURE);
    }

    function readAmountFromEscrow(uint256 index) public view returns (uint256 amount) {
        (,,,,,,,amount) = c.escrows(index);
        return amount;
    }

    // LUMP SUM DEPOSIT
    // su

    function testCanDepositFunds() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);

        (
            ,
            ,
            ,
            bool isReleased,
            bool isRevokedBeforeMaturing,
            bool isRevokedAfterMaturing,
            ,
            uint256 amount
        ) = c.escrows(index);

        assertEq(
            isReleased || isRevokedBeforeMaturing || isRevokedAfterMaturing,
            false,
            "Must be unset"
        );

        assertEq(t.balanceOf(c.owner()), comission, 'Comission must be sent');
        assertEq(t.balanceOf(address(c)), TOTAL_AMOUNT_MINUS_1 - comission, "The rest of the sum is on the contract");
        assertEq(amount, TOTAL_AMOUNT_MINUS_1 - comission, "And written in the escrow");
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT, "Funder spends");
        assertEq(t.balanceOf(GRANTEE), 0, "But grantee gets nothing right away");
    }

    function testEscrowCanBeOnlyReleasedByGrantee() public {
        uint256 index = makeADeposit();

        vm.prank(GIVER);
        vm.expectRevert();
        c.release(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT, "Giver gets nothing in case of error");
        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - c.calcCommission(TOTAL_AMOUNT_MINUS_1), "Everything stays");
    }

    function testEscrowCanNotBeReleasedBeforeMaturing() public {
        uint256 index = makeADeposit();

        vm.prank(GRANTEE);
        vm.expectRevert();
        c.release(index);
        assertEq(t.balanceOf(GRANTEE), 0, "Grantee gets nothing in case of error");

        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);
        assertEq(t.balanceOf(GRANTEE), readAmountFromEscrow(index), "Grantee gets everything");
    }

    function testEscrowCanNotBeReleasedTwice() public {
        uint256 index = makeADeposit();

        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.prank(GRANTEE);
        c.release(index);
        assertEq(t.balanceOf(GRANTEE), readAmountFromEscrow(index), "Grantee gets everything");

        vm.prank(GRANTEE);
        vm.expectRevert();
        c.release(index);
    }

    function testEscrowCanBeRevokedInFullBeforeTheFirstQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);

        vm.prank(GIVER);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT + TOTAL_AMOUNT_MINUS_1 - comission, "Revoke before the 1/4 must be complete");

        assertEq(readAmountFromEscrow(index), 0, "Nothing stays on escrow");
    }

    function testEscrowCanBeRevokedInHalfBeforeTheSecondQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);
        uint256 half = (TOTAL_AMOUNT_MINUS_1 - comission) / 2;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT  + half, "Revoke before the 2/4 must be halved");

        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanBeRevokedInThirdBeforeTheThirdQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);
        uint256 third = (TOTAL_AMOUNT_MINUS_1 - comission) / 3;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 + 1) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT  + third, "Revoke before the 3/4 must be 1/3 of the amount");

        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - comission - third, "The other 2/3 stays on escrow");
    }

    function testEscrowCanBeRevokedInQuarterBeforeTheFourthQuarter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);
        uint256 quarter = (TOTAL_AMOUNT_MINUS_1 - comission) / 4;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE - 1) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT  + quarter, "Revoke before the 4/4 must be 1/4 of the amount");

        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - comission - quarter, "The other 3/4 stays on escrow");
    }

    function testEscrowCanNotBeRevokedAnfterMaturingFor30Days() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 1) * 1 days);
        vm.expectRevert();
        c.revoke(index);
        
        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT + TOTAL_AMOUNT_MINUS_1 - comission, "Revoke after maturing + 30 days must be complete");

        assertEq(readAmountFromEscrow(index), 0, "Nothing stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceBefore() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);
        uint256 half = (TOTAL_AMOUNT_MINUS_1 - comission) / 2;
        

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT  + half, "Revoke before the 2/4 must be halved");

        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - comission - half, "The other half stays on escrow");
    }

    function testEscrowCanNotBeRevokedTwiceAfter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT + TOTAL_AMOUNT_MINUS_1 - comission, "Revoke after maturing + 30 days must be complete");

        assertEq(readAmountFromEscrow(index), 0, "Nothing stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(readAmountFromEscrow(index), 0, "Nothing stays on escrow");
    }

    function testEscrowCanBeRevokedBeforeThenAfter() public {
        uint256 index = makeADeposit();
        uint256 comission = c.calcCommission(TOTAL_AMOUNT_MINUS_1);
        uint256 half = (TOTAL_AMOUNT_MINUS_1 - comission) / 2;

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE / 2 - 1) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT  + half, "Revoke before the 2/4 must be halved");

        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(readAmountFromEscrow(index), TOTAL_AMOUNT_MINUS_1 - comission - half, "The other half stays on escrow");

        vm.prank(GIVER);
        vm.warp(block.timestamp + (DAYS_TO_MATURE + 31) * 1 days);
        c.revoke(index);
        assertEq(t.balanceOf(GIVER), 99 * TOTAL_AMOUNT + TOTAL_AMOUNT_MINUS_1 - comission, "Revoke after maturing + 30 days must be complete");

        assertEq(readAmountFromEscrow(index), 0, "Nothing stays on escrow");

        vm.prank(GIVER);
        vm.expectRevert();
        c.revoke(index);
        assertEq(readAmountFromEscrow(index), 0, "Nothing stays on escrow");
    }
}