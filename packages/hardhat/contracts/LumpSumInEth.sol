//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "./LumpSum.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract LumpSumInEth is LumpSum {
    function deposit(uint256) internal override {
        // pass, eth is automatically deposited
    }

    function transfer(address, address to, uint256 amount) internal override {
        Address.sendValue(payable(to), amount);
    }

    function inferFullSum() internal override returns(uint256 amount){
        return msg.value;
    }
}