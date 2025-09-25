// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "../lib/MultiPhaseSecureOperation.sol";

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
 * - Workflow definitions (how operations are executed)
 */
interface IDefinitionContract {
    /**
     * @dev Struct to hold role permission data
     * @param roleHashes Array of role hashes
     * @param functionPermissions Array of function permissions (parallel to roleHashes)
     */
    struct RolePermission {
        bytes32[] roleHashes;
        MultiPhaseSecureOperation.FunctionPermission[] functionPermissions;
    }

    /**
     * @dev Struct representing a single step in a workflow
     * @param functionName Name of the function to execute
     * @param functionSelector Function selector (bytes4)
     * @param action The transaction action type
     * @param roles Array of roles that can execute this step
     * @param description Human-readable description of the step
     * @param isOffChain Whether this step is executed off-chain
     * @param phaseType Type of phase ("SIGNING" or "EXECUTION")
     */
    struct WorkflowStep {
        string functionName;
        bytes4 functionSelector;
        MultiPhaseSecureOperation.TxAction action;
        string[] roles;
        string description;
        bool isOffChain;
        string phaseType;
    }

    /**
     * @dev Struct representing a complete workflow path
     * @param name Name of the workflow path
     * @param description Human-readable description of the path
     * @param steps Array of steps in this workflow path
     * @param workflowType Type of workflow (0=TIME_DELAY_ONLY, 1=META_TX_ONLY, 2=HYBRID)
     * @param estimatedTimeSec Estimated time to complete in seconds
     * @param requiresSignature Whether this path requires signature
     * @param hasOffChainPhase Whether this path has off-chain steps
     */
    struct WorkflowPath {
        string name;
        string description;
        WorkflowStep[] steps;
        uint8 workflowType;
        uint256 estimatedTimeSec;
        bool requiresSignature;
        bool hasOffChainPhase;
    }

    /**
     * @dev Struct representing a complete operation workflow
     * @param operationType The operation type hash
     * @param operationName Human-readable name of the operation
     * @param paths Array of available workflow paths for this operation
     * @param supportedRoles Array of roles that can execute this operation
     */
    struct OperationWorkflow {
        bytes32 operationType;
        string operationName;
        WorkflowPath[] paths;
        string[] supportedRoles;
    }
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
     * @dev Returns all role hashes and their corresponding function permissions
     * @return RolePermission struct containing roleHashes and functionPermissions arrays
     */
    function getRolePermissions() external pure returns (RolePermission memory);
    
    /**
     * @dev Returns all operation workflows
     * @return Array of operation workflow definitions
     */
    function getOperationWorkflows() external pure returns (OperationWorkflow[] memory);
    
    /**
     * @dev Returns workflow information for a specific operation type
     * @param operationType The operation type hash to get workflow for
     * @return OperationWorkflow struct containing workflow information for the operation
     */
    function getWorkflowForOperation(bytes32 operationType) external pure returns (OperationWorkflow memory);
    
    /**
     * @dev Returns all available workflow paths
     * @return Array of workflow path definitions
     */
    function getWorkflowPaths() external pure returns (WorkflowPath[] memory);
}
