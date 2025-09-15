// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

/**
 * @dev Interface for definition contracts that provide operation types, function schemas, and role permissions
 * 
 * This interface allows contracts to dynamically load their configuration from external
 * definition contracts, enabling modular and extensible contract initialization.
 * 
 * Definition contracts should implement this interface to provide:
 * - Operation type definitions (what operations are supported)
 * - Function schema definitions (how functions are structured)
 * - Role permission definitions (who can do what)
 */
interface IDefinitionContract {
    /**
     * @dev Returns all operation type definitions
     * @return Array of operation type definitions
     */
    function getOperationTypes() external pure returns (OperationTypeDefinition[] memory);
    
    /**
     * @dev Returns all function schema definitions
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() external pure returns (FunctionSchemaDefinition[] memory);
    
    /**
     * @dev Returns all role permission definitions
     * @return Array of role permission definitions
     */
    function getRolePermissions() external pure returns (RolePermissionDefinition[] memory);
}

/**
 * @dev Struct for operation type definitions
 */
struct OperationTypeDefinition {
    bytes32 operationType;
    string name;
}

/**
 * @dev Struct for function schema definitions
 */
struct FunctionSchemaDefinition {
    string functionName;
    bytes4 functionSelector;
    bytes32 operationType;
    uint8[] supportedActions; // Using uint8 array instead of enum array to avoid circular dependency
}

/**
 * @dev Struct for role permission definitions
 */
struct RolePermissionDefinition {
    bytes32 roleHash;
    bytes4 functionSelector;
    uint8[] grantedActions; // Using uint8 array instead of enum array to avoid circular dependency
}
