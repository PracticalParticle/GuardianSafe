// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "./MultiPhaseSecureOperation.sol";

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
    function getOperationTypes() external pure returns (MultiPhaseSecureOperation.ReadableOperationType[] memory);
    
    /**
     * @dev Returns all function schema definitions
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() external pure returns (MultiPhaseSecureOperation.FunctionSchema[] memory);
    
    /**
     * @dev Returns all role hashes
     * @return Array of role hashes
     */
    function getRoleHashes() external pure returns (bytes32[] memory);
    
    /**
     * @dev Returns all function permissions (parallel to role hashes)
     * @return Array of function permissions
     */
    function getFunctionPermissions() external pure returns (MultiPhaseSecureOperation.FunctionPermission[] memory);
}
