//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

enum MaturityStages {
    FirstQuarter,
    SecondQuarter,
    ThirdQuarter,
    FourthQuarter,
    Matured,
    Unclaimed
}

event LumpSumDeposited(address indexed giver, address indexed grantee, uint256 indexed i, uint256 depositedAmount);
event LumpSumReleased(address indexed giver, address indexed grantee, uint256 indexed i);
event LumpSumRevoked(address indexed giver, address indexed grantee, uint256 indexed i, uint256 oldAmount, uint256 revokedAmount);

interface ILumpSum {
    function planNewCommissionRate(uint8 value) external;
    function adoptNewCommissionRate() external;
    function fundLumpSumGrant(
        address grantee_,
        uint16 daysToMature_
    ) payable external returns(uint256);
    function revoke(uint256 i) external;
    function release(uint256 i) external;
}
