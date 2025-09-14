// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

// Contracts imports
import "../../../lib/MultiPhaseSecureOperation.sol";

/**
 * @title ISecureOwnable
 * @dev Interface for SecureOwnable functionality
 */
interface ISecureOwnable {    
    function owner() external view returns (address);
    function getBroadcaster() external view returns (address);
    function getRecoveryAddress() external view returns (address);
    function getTimeLockPeriodInMinutes() external view returns (uint256);
    function getOperationHistory() external view returns (MultiPhaseSecureOperation.TxRecord[] memory);
    function getOperation(uint256 txId) external view returns (MultiPhaseSecureOperation.TxRecord memory);
    function getSupportedOperationTypes() external view returns (MultiPhaseSecureOperation.ReadableOperationType[] memory);
    function isOperationTypeSupported(bytes32 operationType) external view returns (bool);
}