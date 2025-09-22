// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";
import "./IDefinitionContract.sol";

/**
 * @title SecureOwnableDefinitions
 * @dev Library containing predefined definitions for SecureOwnable initialization
 * This library holds static data that can be used to initialize SecureOwnable contracts
 * without increasing the main contract size
 * 
 * This library implements the IDefinitionContract interface from MultiPhaseSecureOperation
 * and provides a direct initialization function for SecureOwnable contracts
 */
library SecureOwnableDefinitions {
    
    // Operation Type Constants
    bytes32 public constant OWNERSHIP_TRANSFER = keccak256("OWNERSHIP_TRANSFER");
    bytes32 public constant BROADCASTER_UPDATE = keccak256("BROADCASTER_UPDATE");
    bytes32 public constant RECOVERY_UPDATE = keccak256("RECOVERY_UPDATE");
    bytes32 public constant TIMELOCK_UPDATE = keccak256("TIMELOCK_UPDATE");
    
    // Function Selector Constants
    bytes4 public constant TRANSFER_OWNERSHIP_SELECTOR = bytes4(keccak256("executeTransferOwnership(address)"));
    bytes4 public constant UPDATE_BROADCASTER_SELECTOR = bytes4(keccak256("executeBroadcasterUpdate(address)"));
    bytes4 public constant UPDATE_RECOVERY_SELECTOR = bytes4(keccak256("executeRecoveryUpdate(address)"));
    bytes4 public constant UPDATE_TIMELOCK_SELECTOR = bytes4(keccak256("executeTimeLockUpdate(uint256)"));
    
    // Time Delay Function Selectors
    bytes4 public constant TRANSFER_OWNERSHIP_REQUEST_SELECTOR = bytes4(keccak256("transferOwnershipRequest()"));
    bytes4 public constant TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR = bytes4(keccak256("transferOwnershipDelayedApproval(uint256)"));
    bytes4 public constant TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR = bytes4(keccak256("transferOwnershipCancellation(uint256)"));
    bytes4 public constant UPDATE_BROADCASTER_REQUEST_SELECTOR = bytes4(keccak256("updateBroadcasterRequest(address)"));
    bytes4 public constant UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR = bytes4(keccak256("updateBroadcasterDelayedApproval(uint256)"));
    bytes4 public constant UPDATE_BROADCASTER_CANCELLATION_SELECTOR = bytes4(keccak256("updateBroadcasterCancellation(uint256)"));
    
    // Meta-transaction Function Selectors
    bytes4 public constant TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR = bytes4(keccak256("transferOwnershipApprovalWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 public constant TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR = bytes4(keccak256("transferOwnershipCancellationWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 public constant UPDATE_BROADCASTER_APPROVE_META_SELECTOR = bytes4(keccak256("updateBroadcasterApprovalWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 public constant UPDATE_BROADCASTER_CANCEL_META_SELECTOR = bytes4(keccak256("updateBroadcasterCancellationWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 public constant UPDATE_RECOVERY_META_SELECTOR = bytes4(keccak256("updateRecoveryRequestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    bytes4 public constant UPDATE_TIMELOCK_META_SELECTOR = bytes4(keccak256("updateTimeLockRequestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    
    // Use the structs from MultiPhaseSecureOperation
    // These are now defined in the main library
    
    /**
     * @dev Returns predefined operation types
     * @return Array of operation type definitions
     */
    function getOperationTypes() public pure returns (MultiPhaseSecureOperation.ReadableOperationType[] memory) {
        MultiPhaseSecureOperation.ReadableOperationType[] memory types = new MultiPhaseSecureOperation.ReadableOperationType[](4);
        
        types[0] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("OWNERSHIP_TRANSFER"),
            name: "OWNERSHIP_TRANSFER"
        });
        
        types[1] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("BROADCASTER_UPDATE"),
            name: "BROADCASTER_UPDATE"
        });
        
        types[2] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("RECOVERY_UPDATE"),
            name: "RECOVERY_UPDATE"
        });
        
        types[3] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("TIMELOCK_UPDATE"),
            name: "TIMELOCK_UPDATE"
        });
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (MultiPhaseSecureOperation.FunctionSchema[] memory) {
        MultiPhaseSecureOperation.FunctionSchema[] memory schemas = new MultiPhaseSecureOperation.FunctionSchema[](12);
        
        // Meta-transaction function schemas
        MultiPhaseSecureOperation.TxAction[] memory metaApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE;
        metaApproveActions[1] = MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory metaCancelActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL;
        metaCancelActions[1] = MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL;
        
        MultiPhaseSecureOperation.TxAction[] memory metaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        metaRequestApproveActions[1] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](2);
        timeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        timeDelayRequestActions[1] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        timeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        timeDelayApproveActions[1] = MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](2);
        timeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        timeDelayCancelActions[1] = MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL;
        
        // Meta-transaction functions
        schemas[0] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipApprovalWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: metaApproveActions
        });
        
        schemas[1] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipCancellationWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: metaCancelActions
        });
        
        schemas[2] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterApprovalWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: metaApproveActions
        });
        
        schemas[3] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterCancellationWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: metaCancelActions
        });
        
        schemas[4] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateRecoveryRequestAndApprove",
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            operationType: RECOVERY_UPDATE,
            supportedActions: metaRequestApproveActions
        });
        
        schemas[5] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateTimeLockRequestAndApprove",
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            operationType: TIMELOCK_UPDATE,
            supportedActions: metaRequestApproveActions
        });
        
        // Time-delayed functions
        schemas[6] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[7] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipDelayedApproval",
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[8] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipCancellation",
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayCancelActions
        });
        
        schemas[9] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[10] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterDelayedApproval",
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[11] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterCancellation",
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayCancelActions
        });
        
        return schemas;
    }
    
    /**
     * @dev Returns predefined role hashes
     * @return Array of role hashes
     */
    function getRoleHashes() public pure returns (bytes32[] memory) {
        bytes32[] memory roleHashes = new bytes32[](19);
        
        // Broadcaster role permissions (6 entries)
        roleHashes[0] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        roleHashes[1] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        roleHashes[2] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        roleHashes[3] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        roleHashes[4] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        roleHashes[5] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        
        // Owner role permissions (10 entries)
        roleHashes[6] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[7] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[8] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[9] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[10] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[11] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[12] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[13] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[14] = MultiPhaseSecureOperation.OWNER_ROLE;
        roleHashes[15] = MultiPhaseSecureOperation.OWNER_ROLE;
        
        // Recovery role permissions (3 entries)
        roleHashes[16] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        roleHashes[17] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        roleHashes[18] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        
        return roleHashes;
    }
    
    /**
     * @dev Returns predefined function permissions (parallel to role hashes)
     * @return Array of function permissions
     */
    function getFunctionPermissions() public pure returns (MultiPhaseSecureOperation.FunctionPermission[] memory) {
        MultiPhaseSecureOperation.FunctionPermission[] memory permissions = new MultiPhaseSecureOperation.FunctionPermission[](19);
        
        // Broadcaster role permissions
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL;
        
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        permissions[0] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            grantedActions: broadcasterMetaApproveActions
        });
        
        permissions[1] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            grantedActions: broadcasterMetaCancelActions
        });
        
        permissions[2] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            grantedActions: broadcasterMetaApproveActions
        });
        
        permissions[3] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            grantedActions: broadcasterMetaCancelActions
        });
        
        permissions[4] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            grantedActions: broadcasterMetaRequestApproveActions
        });
        
        permissions[5] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            grantedActions: broadcasterMetaRequestApproveActions
        });
        
        // Owner role permissions
        MultiPhaseSecureOperation.TxAction[] memory ownerTimeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTimeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerTimeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTimeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerTimeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTimeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;

        MultiPhaseSecureOperation.TxAction[] memory ownerMetaApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE;

        MultiPhaseSecureOperation.TxAction[] memory ownerMetaCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaCancelActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL;

        MultiPhaseSecureOperation.TxAction[] memory ownerMetaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        
        permissions[6] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedActions: ownerTimeDelayApproveActions
        });

        permissions[7] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            grantedActions: ownerMetaApproveActions
        });

        permissions[8] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            grantedActions: ownerMetaCancelActions
        });
        
        permissions[9] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            grantedActions: ownerTimeDelayRequestActions
        });
        
        permissions[10] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            grantedActions: ownerTimeDelayApproveActions
        });
        
        permissions[11] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            grantedActions: ownerTimeDelayCancelActions
        });
        
        permissions[12] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            grantedActions: ownerMetaApproveActions
        });
              
        permissions[13] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            grantedActions: ownerMetaCancelActions
        });
         
        permissions[14] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            grantedActions: ownerMetaRequestApproveActions
        });

        permissions[15] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            grantedActions: ownerMetaRequestApproveActions
        });
        
        // Recovery role permissions
        MultiPhaseSecureOperation.TxAction[] memory recoveryTimeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTimeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory recoveryTimeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTimeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory recoveryTimeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTimeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        
        permissions[16] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            grantedActions: recoveryTimeDelayRequestActions
        });
        
        permissions[17] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedActions: recoveryTimeDelayApproveActions
        });
        
        permissions[18] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            grantedActions: recoveryTimeDelayCancelActions
        });
        
        return permissions;
    }
}
