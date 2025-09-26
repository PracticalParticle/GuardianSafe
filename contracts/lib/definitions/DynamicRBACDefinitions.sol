// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.2;

import "../StateAbstraction.sol";
import "../../interfaces/IDefinition.sol";

/**
 * @title DynamicRBACDefinitions
 * @dev Library containing predefined definitions for DynamicRBAC initialization
 * This library holds static data that can be used to initialize DynamicRBAC contracts
 * without increasing the main contract size
 * 
 * This library implements the IDefinition interface from StateAbstraction
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
    function getOperationTypes() public pure returns (StateAbstraction.ReadableOperationType[] memory) {
        StateAbstraction.ReadableOperationType[] memory types = new StateAbstraction.ReadableOperationType[](1);
        
        types[0] = StateAbstraction.ReadableOperationType({
            operationType: keccak256("ROLE_EDITING_TOGGLE"),
            name: "ROLE_EDITING_TOGGLE"
        });
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (StateAbstraction.FunctionSchema[] memory) {
        StateAbstraction.FunctionSchema[] memory schemas = new StateAbstraction.FunctionSchema[](1);
        
        // Meta-transaction function schemas
        StateAbstraction.TxAction[] memory metaRequestApproveActions = new StateAbstraction.TxAction[](2);
        metaRequestApproveActions[0] = StateAbstraction.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        metaRequestApproveActions[1] = StateAbstraction.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        schemas[0] = StateAbstraction.FunctionSchema({
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
    function getRolePermissions() public pure returns (IDefinition.RolePermission memory) {
        bytes32[] memory roleHashes;
        StateAbstraction.FunctionPermission[] memory functionPermissions;
        roleHashes = new bytes32[](1);
        functionPermissions = new StateAbstraction.FunctionPermission[](1);
        
        // Role editing toggle permission (only broadcaster can execute)
        StateAbstraction.TxAction[] memory broadcasterActions = new StateAbstraction.TxAction[](1);
        broadcasterActions[0] = StateAbstraction.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        // Broadcaster: Role Editing Toggle Meta
        roleHashes[0] = StateAbstraction.BROADCASTER_ROLE;
        functionPermissions[0] = StateAbstraction.FunctionPermission({
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            grantedActions: broadcasterActions
        });
        
        return IDefinition.RolePermission({
            roleHashes: roleHashes,
            functionPermissions: functionPermissions
        });
    }
    
    /**
     * @dev Returns all operation workflows
     * @return Array of operation workflow definitions
     */
    function getOperationWorkflows() public pure returns (IDefinition.OperationWorkflow[] memory) {
        IDefinition.OperationWorkflow[] memory workflows = new IDefinition.OperationWorkflow[](1);
        
        // Role Editing Toggle Workflow
        IDefinition.WorkflowPath[] memory roleTogglePaths = new IDefinition.WorkflowPath[](1);
        
        // Meta-transaction path for role editing toggle
        IDefinition.WorkflowStep[] memory metaTxSteps = new IDefinition.WorkflowStep[](2);
        
        // Step 1: Sign meta-transaction (off-chain)
        string[] memory ownerRoles = new string[](1);
        ownerRoles[0] = "OWNER";
        
        metaTxSteps[0] = IDefinition.WorkflowStep({
            functionName: "updateRoleEditingToggleRequestAndApprove",
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            action: StateAbstraction.TxAction.SIGN_META_REQUEST_AND_APPROVE,
            roles: ownerRoles,
            description: "Owner signs meta-transaction to toggle role editing",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        
        // Step 2: Execute meta-transaction (on-chain)
        string[] memory broadcasterRoles = new string[](1);
        broadcasterRoles[0] = "BROADCASTER";
        
        metaTxSteps[1] = IDefinition.WorkflowStep({
            functionName: "updateRoleEditingToggleRequestAndApprove",
            functionSelector: ROLE_EDITING_TOGGLE_META_SELECTOR,
            action: StateAbstraction.TxAction.EXECUTE_META_REQUEST_AND_APPROVE,
            roles: broadcasterRoles,
            description: "Broadcaster executes meta-transaction to toggle role editing",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        roleTogglePaths[0] = IDefinition.WorkflowPath({
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
        
        workflows[0] = IDefinition.OperationWorkflow({
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
    function getWorkflowForOperation(bytes32 operationType) public pure returns (IDefinition.OperationWorkflow memory) {
        if (operationType == ROLE_EDITING_TOGGLE) {
            IDefinition.OperationWorkflow[] memory workflows = getOperationWorkflows();
            return workflows[0];
        }
        
        // Return empty workflow for unknown operation types
        IDefinition.WorkflowPath[] memory emptyPaths = new IDefinition.WorkflowPath[](0);
        string[] memory emptyRoles = new string[](0);
        
        return IDefinition.OperationWorkflow({
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
    function getWorkflowPaths() public pure returns (IDefinition.WorkflowPath[] memory) {
        IDefinition.OperationWorkflow[] memory workflows = getOperationWorkflows();
        IDefinition.WorkflowPath[] memory allPaths = new IDefinition.WorkflowPath[](1);
        
        // Extract paths from workflows
        allPaths[0] = workflows[0].paths[0];
        
        return allPaths;
    }
    
}
