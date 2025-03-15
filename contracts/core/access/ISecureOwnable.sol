// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.0;

import "../../lib/MultiPhaseSecureOperation.sol";


interface ISecureOwnable {    
    function owner() external view returns (address);
    function getBroadcaster() external view returns (address);
    function getRecoveryAddress() external view returns (address);
    function getTimeLockPeriodInMinutes() external view returns (uint256);
}
