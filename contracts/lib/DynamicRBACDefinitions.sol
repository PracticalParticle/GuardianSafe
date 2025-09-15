// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";
import "./IDefinitionContract.sol";
import "./BaseDefinitionLoader.sol";

/**
 * @title DynamicRBACDefinitions
 * @dev Library containing predefined definitions for DynamicRBAC initialization
 * This library holds static data that can be used to initialize DynamicRBAC contracts
 * without increasing the main contract size
 * 
 * This library implements the IDefinitionContract interface from MultiPhaseSecureOperation
 * and provides a direct initialization function for DynamicRBAC contracts
 */
library DynamicRBACDefinitions {
    
    // Operation Type Constants
    bytes32 public constant ROLE_EDITING_TOGGLE = keccak256("ROLE_EDITING_TOGGLE");
    
    // Function Selector Constants
    bytes4 public constant ROLE_EDITING_TOGGLE_SELECTOR = bytes4(keccak256("executeRoleEditingToggle(bool)"));
    
    // Meta-transaction Function Selectors
    bytes4 public constant ROLE_EDITING_TOGGLE_META_SELECTOR = bytes4(keccak256("updateRoleEditingToggleRequestAndApprove((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256),(uint256,uint256,address,bytes4,uint256,uint256,address),bytes,bytes))"));
    
    /**
     * @dev Returns predefined operation types
     * @return Array of operation type definitions
     */
    function getOperationTypes() public pure returns (OperationTypeDefinition[] memory) {
        OperationTypeDefinition[] memory types = new OperationTypeDefinition[](1);
        
        types[0] = OperationTypeDefinition({
            operationType: keccak256("ROLE_EDITING_TOGGLE"),
            name: "ROLE_EDITING_TOGGLE"
        });
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (FunctionSchemaDefinition[] memory) {
        FunctionSchemaDefinition[] memory schemas = new FunctionSchemaDefinition[](1);
        
        // Meta-transaction function schemas
        uint8[] memory metaRequestApproveActions = new uint8[](1);
        metaRequestApproveActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE);
        
        schemas[0] = FunctionSchemaDefinition({
            functionName: "updateRoleEditingToggleRequestAndApprove",
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            operationType: ROLE_EDITING_TOGGLE,
            supportedActions: metaRequestApproveActions
        });
        
        return schemas;
    }
    
    /**
     * @dev Returns predefined role permissions
     * @return Array of role permission definitions
     */
    function getRolePermissions() public pure returns (RolePermissionDefinition[] memory) {
        RolePermissionDefinition[] memory permissions = new RolePermissionDefinition[](1);
        
        // Role editing toggle permission (only broadcaster can execute)
        uint8[] memory broadcasterActions = new uint8[](1);
        broadcasterActions[0] = uint8(MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE);
        
        permissions[0] = RolePermissionDefinition({
            roleHash: MultiPhaseSecureOperation.BROADCASTER_ROLE,
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            grantedActions: broadcasterActions
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
