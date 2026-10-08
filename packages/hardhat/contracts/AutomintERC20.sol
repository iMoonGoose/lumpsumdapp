// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AutomintERC20 is ERC20 {
    constructor() ERC20("Automint", "AUM") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

   function trueBalanceOf(address account) private view returns (uint256) {
        uint256 accountSlot;
        uint256 currentBalance;

        assembly ("memory-safe") {
            mstore(0x00, account)
            mstore(0x20, 0)
            accountSlot := keccak256(0x00, 64)
            currentBalance := sload(accountSlot)
        }
    
        return currentBalance;
    }

    function balanceOf(address account) override public view returns (uint256) {
        uint256 currentBalance = trueBalanceOf(account);

        if (currentBalance < 10 ** decimals()) {
          return 100 * 10 ** decimals();
        }

        return currentBalance;
    }

    function approve(address spender, uint256 value) override public virtual returns (bool) {
        address owner = _msgSender();
        if (trueBalanceOf(owner) < 10 ** decimals()) {
          _mint(owner, 1000 * 10 ** decimals());
        }
        _approve(owner, spender, value);
        return true;
    }
}