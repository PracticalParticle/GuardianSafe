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
    function getRecovery() external view returns (address);
    function getTimeLockPeriodSec() external view returns (uint256);
    function getTransactionHistory(uint256 fromTxId, uint256 toTxId) external view returns (MultiPhaseSecureOperation.TxRecord[] memory);
    function getTransaction(uint256 txId) external view returns (MultiPhaseSecureOperation.TxRecord memory);
    function getSupportedOperationTypes() external view returns (bytes32[] memory);
    function isOperationTypeSupported(bytes32 operationType) external view returns (bool);
}