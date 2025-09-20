// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";
import "./IDefinitionContract.sol";

/**
 * @title MultiPhaseSecureOperationDefinitions
 * @dev Library containing predefined definitions for MultiPhaseSecureOperation initialization
 * This library holds static data that can be used to initialize MultiPhaseSecureOperation contracts
 * without increasing the main contract size
 * 
 * This library implements the IDefinitionContract interface from MultiPhaseSecureOperation
 * and provides a direct initialization function for MultiPhaseSecureOperation contracts
 */
library MultiPhaseSecureOperationDefinitions {
    
    // Operation Type Constants
    bytes32 public constant SYSTEM_OPERATION = keccak256("SYSTEM_OPERATION");
    
    
    
    /**
     * @dev Returns predefined operation types
     * @return Array of operation type definitions
     */
    function getOperationTypes() public pure returns (MultiPhaseSecureOperation.ReadableOperationType[] memory) {
        MultiPhaseSecureOperation.ReadableOperationType[] memory types = new MultiPhaseSecureOperation.ReadableOperationType[](0);
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas based on MultiPhaseSecureOperation.initializeBaseFunctionSchemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (MultiPhaseSecureOperation.FunctionSchema[] memory) {
        MultiPhaseSecureOperation.FunctionSchema[] memory schemas = new MultiPhaseSecureOperation.FunctionSchema[](7);
        
        // Time-delay function schemas (matching initializeBaseFunctionSchemas)
        MultiPhaseSecureOperation.TxAction[] memory timeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        
        // Meta-transaction function schemas (matching initializeBaseFunctionSchemas)
        MultiPhaseSecureOperation.TxAction[] memory metaTxApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaTxApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE;
        metaTxApproveActions[1] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory metaTxCancelActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaTxCancelActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL;
        metaTxCancelActions[1] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL;
        
        MultiPhaseSecureOperation.TxAction[] memory metaTxRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaTxRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        metaTxRequestApproveActions[1] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        // Core MultiPhase functions (matching initializeBaseFunctionSchemas exactly)
        schemas[0] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "txRequest",
            functionSelector: MultiPhaseSecureOperation.TX_REQUEST_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayRequestActions
        });
        
        schemas[1] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "txDelayedApproval",
            functionSelector: MultiPhaseSecureOperation.TX_DELAYED_APPROVAL_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayApproveActions
        });
        
        schemas[2] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "txCancellation",
            functionSelector: MultiPhaseSecureOperation.TX_CANCELLATION_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayCancelActions
        });
        
        schemas[3] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "txApprovalWithMetaTx",
            functionSelector: MultiPhaseSecureOperation.META_TX_APPROVAL_SELECTOR,
            operationType: bytes32(0),
            supportedActions: metaTxApproveActions
        });
        
        schemas[4] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "txCancellationWithMetaTx",
            functionSelector: MultiPhaseSecureOperation.META_TX_CANCELLATION_SELECTOR,
            operationType: bytes32(0),
            supportedActions: metaTxCancelActions
        });
        
        schemas[5] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "requestAndApprove",
            functionSelector: MultiPhaseSecureOperation.META_TX_REQUEST_AND_APPROVE_SELECTOR,
            operationType: bytes32(0),
            supportedActions: metaTxRequestApproveActions
        });
        
        // Payment function schemas
        schemas[6] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updatePaymentForTransaction",
            functionSelector: MultiPhaseSecureOperation.UPDATE_PAYMENT_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayRequestActions
        });
        
        return schemas;
    }
    
    /**
     * @dev Returns predefined role hashes based on MultiPhaseSecureOperation.initializeBaseRoles
     * @return Array of role hashes
     */
    function getRoleHashes() public pure returns (bytes32[] memory) {
        bytes32[] memory roleHashes = new bytes32[](12);
        
        // Owner role permissions (6 entries)
        roleHashes[0] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[1] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[2] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[3] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[4] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[5] = MultiPhaseSecureOperation.OWNER_ROLE;
        
        // Broadcaster role permissions (3 entries)
        roleHashes[6] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        roleHashes[7] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        roleHashes[8] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        
        // Recovery role permissions (3 entries)
        roleHashes[9] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        roleHashes[10] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        roleHashes[11] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        
        return roleHashes;
    }
    
    /**
     * @dev Returns predefined function permissions based on MultiPhaseSecureOperation.initializeBaseRoles
     * @return Array of function permissions (parallel to role hashes)
     */
    function getFunctionPermissions() public pure returns (MultiPhaseSecureOperation.FunctionPermission[] memory) {
        MultiPhaseSecureOperation.FunctionPermission[] memory permissions = new MultiPhaseSecureOperation.FunctionPermission[](12);
        
        // Owner role permissions (matching initializeBaseRoles exactly)
        MultiPhaseSecureOperation.TxAction[] memory ownerTxRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTxRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerTxApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTxApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerTxCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTxCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerMetaTxRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaTxRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerMetaTxApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaTxApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerMetaTxCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaTxCancelActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL;
        
        permissions[0] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.TX_REQUEST_SELECTOR,
            grantedActions: ownerTxRequestActions
        });
        
        permissions[1] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.TX_DELAYED_APPROVAL_SELECTOR,
            grantedActions: ownerTxApproveActions
        });
        
        permissions[2] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.TX_CANCELLATION_SELECTOR,
            grantedActions: ownerTxCancelActions
        });
        
        permissions[3] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.META_TX_REQUEST_AND_APPROVE_SELECTOR,
            grantedActions: ownerMetaTxRequestApproveActions
        });
        
        permissions[4] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.META_TX_APPROVAL_SELECTOR,
            grantedActions: ownerMetaTxApproveActions
        });
        
        permissions[5] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.META_TX_CANCELLATION_SELECTOR,
            grantedActions: ownerMetaTxCancelActions
        });
        
        // Broadcaster role permissions (matching initializeBaseRoles exactly)
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaTxRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaTxRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaTxApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaTxApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaTxCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaTxCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL;
        
        permissions[6] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.META_TX_REQUEST_AND_APPROVE_SELECTOR,
            grantedActions: broadcasterMetaTxRequestApproveActions
        });
        
        permissions[7] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.META_TX_APPROVAL_SELECTOR,
            grantedActions: broadcasterMetaTxApproveActions
        });
        
        permissions[8] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.META_TX_CANCELLATION_SELECTOR,
            grantedActions: broadcasterMetaTxCancelActions
        });
        
        // Recovery role permissions (matching initializeBaseRoles exactly)
        MultiPhaseSecureOperation.TxAction[] memory recoveryTxRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTxRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory recoveryTxApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTxApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory recoveryTxCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTxCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        
        permissions[9] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.TX_REQUEST_SELECTOR,
            grantedActions: recoveryTxRequestActions
        });
        
        permissions[10] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.TX_DELAYED_APPROVAL_SELECTOR,
            grantedActions: recoveryTxApproveActions
        });
        
        permissions[11] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: MultiPhaseSecureOperation.TX_CANCELLATION_SELECTOR,
            grantedActions: recoveryTxCancelActions
        });
        
        return permissions;
    }
    
    /**
     * @dev Loads definitions directly into a SecureOperationState
     * This function initializes the secure state with all predefined definitions
     * @param secureState The SecureOperationState to initialize
     */
    function loadDefinitionContract(
        MultiPhaseSecureOperation.SecureOperationState storage secureState
    ) public {
        MultiPhaseSecureOperation.loadDefinitionContract(
            secureState,
            getOperationTypes(),
            getFunctionSchemas(),
            getRoleHashes(),
            getFunctionPermissions()
        );
    }
}
