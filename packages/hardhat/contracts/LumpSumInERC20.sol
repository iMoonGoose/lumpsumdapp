//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "./LumpSum.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LumpSumInERC20 is LumpSum {
    IERC20 public immutable token;

    constructor(address token_) {
        token = IERC20(token_);
    }

    function deposit(uint256 amount) internal override {
        token.transferFrom(msg.sender, address(this), amount);
    }

    function transfer(address from, address to, uint256 amount) internal override {
        if (from == address(this)) {
            token.transfer(to, amount);
        } else {
            token.transferFrom(from, to, amount);
        }
    }

    function inferFullSum() internal view override returns(uint256 amount){
        // reverting it to 0 makes it very expensive to allocate again
        return token.allowance(msg.sender, address(this)) - 1;
    }
}