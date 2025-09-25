// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

// Import TxRecord struct from MultiPhaseSecureOperation
import "../lib/MultiPhaseSecureOperation.sol";

/**
 * @title IEventForwarder
 * @dev Interface for the event forwarder contract
 * 
 * This interface defines the contract for forwarding events from deployed instances
 * to a centralized event monitoring system. It uses function selectors for efficient
 * event identification and categorization.
 */
interface IEventForwarder {
    /**
     * @dev Forward a transaction event from a deployed instance
     * @param triggerFunc The trigger function for the event (function name)
     * @param txRecord The transaction record
     * @param decodedParams The decoded parameters
     */
    function forwardTxEvent(MultiPhaseSecureOperation.TxRecord calldata txRecord, string calldata triggerFunc, bytes calldata decodedParams) external;
}
