// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";
import "./IDefinitionContract.sol";
import "./BaseDefinitionLoader.sol";

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
    
    // Function Selector Constants for core MultiPhase functions
    bytes4 public constant TX_REQUEST_SELECTOR = bytes4(keccak256("txRequest(address,address,uint256,uint256,bytes32,uint8,bytes)"));
    bytes4 public constant TX_DELAYED_APPROVAL_SELECTOR = bytes4(keccak256("txDelayedApproval(uint256)"));
    bytes4 public constant TX_CANCELLATION_SELECTOR = bytes4(keccak256("txCancellation(uint256)"));
    bytes4 public constant META_TX_APPROVAL_SELECTOR = bytes4(keccak256("txApprovalWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes,(address,uint256,address,uint256)),(uint256,address,bytes4,uint256,uint256,uint256,address),bytes,bytes)"));
    bytes4 public constant META_TX_CANCELLATION_SELECTOR = bytes4(keccak256("txCancellationWithMetaTx((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes,(address,uint256,address,uint256)),(uint256,address,bytes4,uint256,uint256,uint256,address),bytes,bytes)"));
    bytes4 public constant META_TX_REQUEST_AND_APPROVE_SELECTOR = bytes4(keccak256("requestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes,(address,uint256,address,uint256)),(uint256,address,bytes4,uint256,uint256,uint256,address),bytes,bytes)"));
    
    // Payment-related function selectors
    bytes4 public constant UPDATE_PAYMENT_SELECTOR = bytes4(keccak256("updatePaymentForTransaction(uint256,(address,uint256,address,uint256))"));
    
    
    /**
     * @dev Returns predefined operation types
     * @return Array of operation type definitions
     */
    function getOperationTypes() public pure returns (OperationTypeDefinition[] memory) {
        OperationTypeDefinition[] memory types = new OperationTypeDefinition[](0);
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas based on MultiPhaseSecureOperation.initializeBaseFunctionSchemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (FunctionSchemaDefinition[] memory) {
        FunctionSchemaDefinition[] memory schemas = new FunctionSchemaDefinition[](7);
        
        // Time-delay function schemas (matching initializeBaseFunctionSchemas)
        uint8[] memory timeDelayRequestActions = new uint8[](1);
        timeDelayRequestActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST);
        
        uint8[] memory timeDelayApproveActions = new uint8[](1);
        timeDelayApproveActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE);
        
        uint8[] memory timeDelayCancelActions = new uint8[](1);
        timeDelayCancelActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL);
        
        // Meta-transaction function schemas (matching initializeBaseFunctionSchemas)
        uint8[] memory metaTxApproveActions = new uint8[](2);
        metaTxApproveActions[0] = uint8(MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE);
        metaTxApproveActions[1] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE);
        
        uint8[] memory metaTxCancelActions = new uint8[](2);
        metaTxCancelActions[0] = uint8(MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL);
        metaTxCancelActions[1] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL);
        
        uint8[] memory metaTxRequestApproveActions = new uint8[](2);
        metaTxRequestApproveActions[0] = uint8(MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE);
        metaTxRequestApproveActions[1] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE);
        
        // Core MultiPhase functions (matching initializeBaseFunctionSchemas exactly)
        schemas[0] = FunctionSchemaDefinition({
            functionName: "txRequest",
            functionSelector: TX_REQUEST_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayRequestActions
        });
        
        schemas[1] = FunctionSchemaDefinition({
            functionName: "txDelayedApproval",
            functionSelector: TX_DELAYED_APPROVAL_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayApproveActions
        });
        
        schemas[2] = FunctionSchemaDefinition({
            functionName: "txCancellation",
            functionSelector: TX_CANCELLATION_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayCancelActions
        });
        
        schemas[3] = FunctionSchemaDefinition({
            functionName: "txApprovalWithMetaTx",
            functionSelector: META_TX_APPROVAL_SELECTOR,
            operationType: bytes32(0),
            supportedActions: metaTxApproveActions
        });
        
        schemas[4] = FunctionSchemaDefinition({
            functionName: "txCancellationWithMetaTx",
            functionSelector: META_TX_CANCELLATION_SELECTOR,
            operationType: bytes32(0),
            supportedActions: metaTxCancelActions
        });
        
        schemas[5] = FunctionSchemaDefinition({
            functionName: "requestAndApprove",
            functionSelector: META_TX_REQUEST_AND_APPROVE_SELECTOR,
            operationType: bytes32(0),
            supportedActions: metaTxRequestApproveActions
        });
        
        // Payment function schemas
        schemas[6] = FunctionSchemaDefinition({
            functionName: "updatePaymentForTransaction",
            functionSelector: UPDATE_PAYMENT_SELECTOR,
            operationType: bytes32(0),
            supportedActions: timeDelayRequestActions
        });
        
        return schemas;
    }
    
    /**
     * @dev Returns predefined role permissions based on MultiPhaseSecureOperation.initializeBaseRoles
     * @return Array of role permission definitions
     */
    function getRolePermissions() public pure returns (RolePermissionDefinition[] memory) {
        RolePermissionDefinition[] memory permissions = new RolePermissionDefinition[](12);
        
        // Owner role permissions (matching initializeBaseRoles exactly)
        permissions[0] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TX_REQUEST_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST)
        });
        
        permissions[1] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TX_DELAYED_APPROVAL_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE)
        });
        
        permissions[2] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: TX_CANCELLATION_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL)
        });
        
        permissions[3] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: META_TX_REQUEST_AND_APPROVE_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE)
        });
        
        permissions[4] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: META_TX_APPROVAL_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE)
        });
        
        permissions[5] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.OWNER_ROLE,
            functionSelector: META_TX_CANCELLATION_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL)
        });
        
        // Broadcaster role permissions (matching initializeBaseRoles exactly)
        permissions[6] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: META_TX_REQUEST_AND_APPROVE_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE)
        });
        
        permissions[7] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: META_TX_APPROVAL_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE)
        });
        
        permissions[8] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: META_TX_CANCELLATION_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL)
        });
        
        // Recovery role permissions (matching initializeBaseRoles exactly)
        permissions[9] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TX_REQUEST_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST)
        });
        
        permissions[10] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TX_DELAYED_APPROVAL_SELECTOR,
            grantedAction: uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE)
        });
        
        permissions[11] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.RECOVERY_ROLE,
            functionSelector: TX_CANCELLATION_SELECTOR,
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
        BaseDefinitionLoader.loadDefinitionContract(
            secureState,
            getOperationTypes(),
            getFunctionSchemas(),
            getRolePermissions()
        );
    }
}
