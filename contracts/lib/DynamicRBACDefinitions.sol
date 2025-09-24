// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";
import "./IDefinitionContract.sol";

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
    bytes4 public constant ROLE_EDITING_TOGGLE_META_SELECTOR = bytes4(keccak256("updateRoleEditingToggleRequestAndApprove(((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256)),(uint256,uint256,address,bytes4,uint8,uint256,uint256,address),bytes32,bytes,bytes))"));
    
    /**
     * @dev Returns predefined operation types
     * @return Array of operation type definitions
     */
    function getOperationTypes() public pure returns (MultiPhaseSecureOperation.ReadableOperationType[] memory) {
        MultiPhaseSecureOperation.ReadableOperationType[] memory types = new MultiPhaseSecureOperation.ReadableOperationType[](1);
        
        types[0] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("ROLE_EDITING_TOGGLE"),
            name: "ROLE_EDITING_TOGGLE"
        });
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (MultiPhaseSecureOperation.FunctionSchema[] memory) {
        MultiPhaseSecureOperation.FunctionSchema[] memory schemas = new MultiPhaseSecureOperation.FunctionSchema[](1);
        
        // Meta-transaction function schemas
        MultiPhaseSecureOperation.TxAction[] memory metaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        metaRequestApproveActions[1] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        schemas[0] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateRoleEditingToggleRequestAndApprove",
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            operationType: ROLE_EDITING_TOGGLE,
            supportedActions: metaRequestApproveActions
        });
        
        return schemas;
    }
    
    /**
     * @dev Returns predefined role hashes
     * @return Array of role hashes
     */
    function getRoleHashes() public pure returns (bytes32[] memory) {
        bytes32[] memory roleHashes = new bytes32[](1);
        
        // Role editing toggle permission (only broadcaster can execute)
        roleHashes[0] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        
        return roleHashes;
    }
    
    /**
     * @dev Returns predefined function permissions (parallel to role hashes)
     * @return Array of function permissions
     */
    function getFunctionPermissions() public pure returns (MultiPhaseSecureOperation.FunctionPermission[] memory) {
        MultiPhaseSecureOperation.FunctionPermission[] memory permissions = new MultiPhaseSecureOperation.FunctionPermission[](1);
        
        // Role editing toggle permission (only broadcaster can execute)
        MultiPhaseSecureOperation.TxAction[] memory broadcasterActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        permissions[0] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            grantedActions: broadcasterActions
        });
        
        return permissions;
    }
    
}
