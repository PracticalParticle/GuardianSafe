// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";
import "./IDefinitionContract.sol";

/**
 * @title BaseDefinitionLoader
 * @dev Base library containing the common loadDefinitionContract implementation
 * This library provides a reusable implementation for loading definitions into SecureOperationState
 * 
 * All definition libraries can use this base to avoid code duplication
 */
library BaseDefinitionLoader {
    
    /**
     * @dev Loads definitions directly into a SecureOperationState
     * This function initializes the secure state with all predefined definitions
     * @param secureState The SecureOperationState to initialize
     * @param operationTypes Array of operation type definitions
     * @param functionSchemas Array of function schema definitions  
     * @param rolePermissions Array of role permission definitions
     */
    function loadDefinitionContract(
        MultiPhaseSecureOperation.SecureOperationState storage secureState,
        OperationTypeDefinition[] memory operationTypes,
        FunctionSchemaDefinition[] memory functionSchemas,
        RolePermissionDefinition[] memory rolePermissions
    ) public {
        // Load operation types
        for (uint256 i = 0; i < operationTypes.length; i++) {
            MultiPhaseSecureOperation.addOperationType(secureState, MultiPhaseSecureOperation.ReadableOperationType({
                operationType: operationTypes[i].operationType,
                name: operationTypes[i].name
            }));
        }
        
        // Load function schemas
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
        for (uint256 i = 0; i < rolePermissions.length; i++) {
            // Convert uint8 array to TxAction array
            MultiPhaseSecureOperation.TxAction[] memory actions = new MultiPhaseSecureOperation.TxAction[](rolePermissions[i].grantedActions.length);
            for (uint256 j = 0; j < rolePermissions[i].grantedActions.length; j++) {
                actions[j] = MultiPhaseSecureOperation.TxAction(rolePermissions[i].grantedActions[j]);
            }
            
            MultiPhaseSecureOperation.addFunctionToRole(
                secureState,
                rolePermissions[i].roleHash,
                rolePermissions[i].functionSelector,
                actions
            );
        }
    }
}
