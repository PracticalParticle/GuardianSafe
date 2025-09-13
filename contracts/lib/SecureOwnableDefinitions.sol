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
        uint8[] memory metaApproveActions = new uint8[](1);
        metaApproveActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE);
        
        uint8[] memory metaCancelActions = new uint8[](1);
        metaCancelActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL);
        
        uint8[] memory metaRequestApproveActions = new uint8[](1);
        metaRequestApproveActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE);
        
        uint8[] memory timeDelayRequestActions = new uint8[](1);
        timeDelayRequestActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST);
        
        uint8[] memory timeDelayApproveActions = new uint8[](1);
        timeDelayApproveActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE);
        
        uint8[] memory timeDelayCancelActions = new uint8[](1);
        timeDelayCancelActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL);
        
        // Meta-transaction functions
        schemas[0] = FunctionSchemaDefinition({
            functionName: "transferOwnershipApprovalWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: metaApproveActions
        });
        
        schemas[1] = FunctionSchemaDefinition({
            functionName: "transferOwnershipCancellationWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: metaCancelActions
        });
        
        schemas[2] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterApprovalWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: metaApproveActions
        });
        
        schemas[3] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterCancellationWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: metaCancelActions
        });
        
        schemas[4] = FunctionSchemaDefinition({
            functionName: "updateRecoveryRequestAndApprove",
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            operationType: RECOVERY_UPDATE,
            supportedActions: metaRequestApproveActions
        });
        
        schemas[5] = FunctionSchemaDefinition({
            functionName: "updateTimeLockRequestAndApprove",
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            operationType: TIMELOCK_UPDATE,
            supportedActions: metaRequestApproveActions
        });
        
        // Time-delayed functions
        schemas[6] = FunctionSchemaDefinition({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[7] = FunctionSchemaDefinition({
            functionName: "transferOwnershipDelayedApproval",
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[8] = FunctionSchemaDefinition({
            functionName: "transferOwnershipCancellation",
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayCancelActions
        });
        
        schemas[9] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[10] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterDelayedApproval",
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[11] = FunctionSchemaDefinition({
            functionName: "updateBroadcasterCancellation",
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            operationType: BROADCASTER_UPDATE,
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
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE)
        });
        
        permissions[1] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL)
        });
        
        permissions[2] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE)
        });
        
        permissions[3] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL)
        });
        
        permissions[4] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE)
        });
        
        permissions[5] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE)
        });
        
        // Owner role permissions
        permissions[6] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST)
        });
        
        permissions[7] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE)
        });
        
        permissions[8] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL)
        });
        
        permissions[9] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST)
        });
        
        permissions[10] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE)
        });
        
        permissions[11] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL)
        });
        
        // Recovery role permissions
        permissions[12] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST)
        });
        
        permissions[13] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE)
        });
        
        permissions[14] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL)
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
        // Load operation types
        OperationTypeDefinition[] memory operationTypes = getOperationTypes();
        for (uint256 i = 0; i < operationTypes.length; i++) {
            MultiPhaseSecureOperation.addOperationType(secureState, MultiPhaseSecureOperation.ReadableOperationType({
                operationType: operationTypes[i].operationType,
                name: operationTypes[i].name
            }));
        }
        
        // Load function schemas
        FunctionSchemaDefinition[] memory functionSchemas = getFunctionSchemas();
        for (uint256 i = 0; i < functionSchemas.length; i++) {
            // Convert uint8 array to TxAction array
            MultiPhaseSecureOperation.TxAction[] memory actions = new MultiPhaseSecureOperation.TxAction[](functionSchemas[i].supportedActions.length);
            for (uint256 j = 0; j < functionSchemas[i].supportedActions.length; j++) {
                actions[j] = MultiPhaseSecureOperation.TxAction(functionSchemas[i].supportedActions[j]);
            }
            
            MultiPhaseSecureOperation.createFunctionSchema(
                secureState,
                functionSchemas[i].functionName,
                functionSchemas[i].functionSelector,
                functionSchemas[i].operationType,
                actions
            );
        }
        
        // Load role permissions
        RolePermissionDefinition[] memory rolePermissions = getRolePermissions();
        for (uint256 i = 0; i < rolePermissions.length; i++) {
            MultiPhaseSecureOperation.addFunctionToRole(
                secureState,
                rolePermissions[i].roleHash,
                rolePermissions[i].functionSelector,
                MultiPhaseSecureOperation.TxAction(rolePermissions[i].grantedAction)
            );
        }
    }
}
