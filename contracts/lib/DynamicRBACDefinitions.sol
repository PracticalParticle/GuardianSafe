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
     * @dev Returns predefined role hashes and their corresponding function permissions
     * @return RolePermission struct containing roleHashes and functionPermissions arrays
     */
    function getRolePermissions() public pure returns (IDefinitionContract.RolePermission memory) {
        bytes32[] memory roleHashes;
        MultiPhaseSecureOperation.FunctionPermission[] memory functionPermissions;
        roleHashes = new bytes32[](1);
        functionPermissions = new MultiPhaseSecureOperation.FunctionPermission[](1);
        
        // Role editing toggle permission (only broadcaster can execute)
        MultiPhaseSecureOperation.TxAction[] memory broadcasterActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        // Broadcaster: Role Editing Toggle Meta
        roleHashes[0] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        functionPermissions[0] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            grantedActions: broadcasterActions
        });
        
        return IDefinitionContract.RolePermission({
            roleHashes: roleHashes,
            functionPermissions: functionPermissions
        });
    }
    
    /**
     * @dev Returns all operation workflows
     * @return Array of operation workflow definitions
     */
    function getOperationWorkflows() public pure returns (IDefinitionContract.OperationWorkflow[] memory) {
        IDefinitionContract.OperationWorkflow[] memory workflows = new IDefinitionContract.OperationWorkflow[](1);
        
        // Role Editing Toggle Workflow
        IDefinitionContract.WorkflowPath[] memory roleTogglePaths = new IDefinitionContract.WorkflowPath[](1);
        
        // Meta-transaction path for role editing toggle
        IDefinitionContract.WorkflowStep[] memory metaTxSteps = new IDefinitionContract.WorkflowStep[](2);
        
        // Step 1: Sign meta-transaction (off-chain)
        string[] memory ownerRoles = new string[](1);
        ownerRoles[0] = "OWNER";
        
        metaTxSteps[0] = IDefinitionContract.WorkflowStep({
            functionName: "updateRoleEditingToggleRequestAndApprove",
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            action: MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE,
            roles: ownerRoles,
            description: "Owner signs meta-transaction to toggle role editing",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        
        // Step 2: Execute meta-transaction (on-chain)
        string[] memory broadcasterRoles = new string[](1);
        broadcasterRoles[0] = "BROADCASTER";
        
        metaTxSteps[1] = IDefinitionContract.WorkflowStep({
            functionName: "updateRoleEditingToggleRequestAndApprove",
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE,
            roles: broadcasterRoles,
            description: "Broadcaster executes meta-transaction to toggle role editing",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        roleTogglePaths[0] = IDefinitionContract.WorkflowPath({
            name: "Meta-Transaction Role Toggle",
            description: "Toggle role editing using meta-transaction (owner signs, broadcaster executes)",
            steps: metaTxSteps,
            workflowType: 1, // META_TX_ONLY
            estimatedTimeSec: 300, // 5 minutes
            requiresSignature: true,
            hasOffChainPhase: true
        });
        
        string[] memory supportedRoles = new string[](2);
        supportedRoles[0] = "OWNER";
        supportedRoles[1] = "BROADCASTER";
        
        workflows[0] = IDefinitionContract.OperationWorkflow({
            operationType: ROLE_EDITING_TOGGLE,
            operationName: "Role Editing Toggle",
            paths: roleTogglePaths,
            supportedRoles: supportedRoles
        });
        
        return workflows;
    }
    
    /**
     * @dev Returns workflow information for a specific operation type
     * @param operationType The operation type hash to get workflow for
     * @return OperationWorkflow struct containing workflow information for the operation
     */
    function getWorkflowForOperation(bytes32 operationType) public pure returns (IDefinitionContract.OperationWorkflow memory) {
        if (operationType == ROLE_EDITING_TOGGLE) {
            IDefinitionContract.OperationWorkflow[] memory workflows = getOperationWorkflows();
            return workflows[0];
        }
        
        // Return empty workflow for unknown operation types
        IDefinitionContract.WorkflowPath[] memory emptyPaths = new IDefinitionContract.WorkflowPath[](0);
        string[] memory emptyRoles = new string[](0);
        
        return IDefinitionContract.OperationWorkflow({
            operationType: operationType,
            operationName: "",
            paths: emptyPaths,
            supportedRoles: emptyRoles
        });
    }
    
    /**
     * @dev Returns all available workflow paths
     * @return Array of workflow path definitions
     */
    function getWorkflowPaths() public pure returns (IDefinitionContract.WorkflowPath[] memory) {
        IDefinitionContract.OperationWorkflow[] memory workflows = getOperationWorkflows();
        IDefinitionContract.WorkflowPath[] memory allPaths = new IDefinitionContract.WorkflowPath[](1);
        
        // Extract paths from workflows
        allPaths[0] = workflows[0].paths[0];
        
        return allPaths;
    }
    
}
