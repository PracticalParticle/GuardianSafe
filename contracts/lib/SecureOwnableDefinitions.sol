// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";

/**
 * @title SecureOwnableDefinitions
 * @dev Library containing predefined definitions for SecureOwnable initialization
 * This library holds static data that can be used to initialize SecureOwnable contracts
 * without increasing the main contract size
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
    
    // Operation Type Definitions
    struct OperationTypeDefinition {
        bytes32 operationType;
        string name;
    }
    
    // Function Schema Definition
    struct FunctionSchemaDefinition {
        string functionName;
        bytes4 functionSelector;
        MultiPhaseSecureOperation.TxAction[] supportedActions;
    }
    
    // Role Permission Definition
    struct RolePermissionDefinition {
        bytes32 roleHash;
        bytes4 functionSelector;
        MultiPhaseSecureOperation.TxAction grantedAction;
    }
    
    /**
     * @dev Returns predefined operation types
     * @return Array of operation type definitions
     */
    function getOperationTypes() public pure returns (OperationTypeDefinition[] memory) {
        OperationTypeDefinition[] memory types = new OperationTypeDefinition[](4);
        
        types[0] = OperationTypeDefinition({
            operationType: keccak256("OWNERSHIP_TRANSFER"),
            name: "OWNERSHIP_TRANSFER"
        });
        
        types[1] = OperationTypeDefinition({
            operationType: keccak256("BROADCASTER_UPDATE"),
            name: "BROADCASTER_UPDATE"
        });
        
        types[2] = OperationTypeDefinition({
            operationType: keccak256("RECOVERY_UPDATE"),
            name: "RECOVERY_UPDATE"
        });
        
        types[3] = OperationTypeDefinition({
            operationType: keccak256("TIMELOCK_UPDATE"),
            name: "TIMELOCK_UPDATE"
        });
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (FunctionSchemaDefinition[] memory) {
        FunctionSchemaDefinition[] memory schemas = new FunctionSchemaDefinition[](12);
        
        // Meta-transaction function schemas
        MultiPhaseSecureOperation.TxAction[] memory metaApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        metaApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory metaCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        metaCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL;
        
        MultiPhaseSecureOperation.TxAction[] memory metaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        metaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        
        // Meta-transaction functions
        schemas[0] = FunctionSchemaDefinition({
            functionName: "transferOwnershipApprovalWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            supportedActions: metaApproveActions
        });
        
        schemas[1] = FunctionSchemaDefinition({
            functionName: "transferOwnershipCancellationWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            supportedActions: metaCancelActions
        });
        
        schemas[2] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterApprovalWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            supportedActions: metaApproveActions
        });
        
        schemas[3] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterCancellationWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            supportedActions: metaCancelActions
        });
        
        schemas[4] = FunctionSchemaDefinition({
            functionName: "updateRecoveryRequestAndApprove",
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            supportedActions: metaRequestApproveActions
        });
        
        schemas[5] = FunctionSchemaDefinition({
            functionName: "updateTimeLockRequestAndApprove",
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            supportedActions: metaRequestApproveActions
        });
        
        // Time-delayed functions
        schemas[6] = FunctionSchemaDefinition({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[7] = FunctionSchemaDefinition({
            functionName: "transferOwnershipDelayedApproval",
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[8] = FunctionSchemaDefinition({
            functionName: "transferOwnershipCancellation",
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            supportedActions: timeDelayCancelActions
        });
        
        schemas[9] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[10] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterDelayedApproval",
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[11] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterCancellation",
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            supportedActions: timeDelayCancelActions
        });
        
        return schemas;
    }
    
    /**
     * @dev Returns predefined role permissions
     * @return Array of role permission definitions
     */
    function getRolePermissions() public pure returns (RolePermissionDefinition[] memory) {
        RolePermissionDefinition[] memory permissions = new RolePermissionDefinition[](18);
        
        // Broadcaster role permissions
        permissions[0] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE
        });
        
        permissions[1] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL
        });
        
        permissions[2] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE
        });
        
        permissions[3] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL
        });
        
        permissions[4] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE
        });
        
        permissions[5] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE
        });
        
        // Owner role permissions
        permissions[6] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST
        });
        
        permissions[7] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE
        });
        
        permissions[8] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL
        });
        
        permissions[9] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST
        });
        
        permissions[10] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE
        });
        
        permissions[11] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL
        });
        
        // Recovery role permissions
        permissions[12] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST
        });
        
        permissions[13] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE
        });
        
        permissions[14] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            grantedAction: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL
        });
        
        return permissions;
    }
}
