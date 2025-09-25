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
    bytes4 public constant TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR = bytes4(keccak256("transferOwnershipApprovalWithMetaTx(((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256)),(uint256,uint256,address,bytes4,uint8,uint256,uint256,address),bytes32,bytes,bytes))"));
    bytes4 public constant TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR = bytes4(keccak256("transferOwnershipCancellationWithMetaTx(((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256)),(uint256,uint256,address,bytes4,uint8,uint256,uint256,address),bytes32,bytes,bytes))"));
    bytes4 public constant UPDATE_BROADCASTER_APPROVE_META_SELECTOR = bytes4(keccak256("updateBroadcasterApprovalWithMetaTx(((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256)),(uint256,uint256,address,bytes4,uint8,uint256,uint256,address),bytes32,bytes,bytes))"));
    bytes4 public constant UPDATE_BROADCASTER_CANCEL_META_SELECTOR = bytes4(keccak256("updateBroadcasterCancellationWithMetaTx(((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256)),(uint256,uint256,address,bytes4,uint8,uint256,uint256,address),bytes32,bytes,bytes))"));
    bytes4 public constant UPDATE_RECOVERY_META_SELECTOR = bytes4(keccak256("updateRecoveryRequestAndApprove(((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256)),(uint256,uint256,address,bytes4,uint8,uint256,uint256,address),bytes32,bytes,bytes))"));
    bytes4 public constant UPDATE_TIMELOCK_META_SELECTOR = bytes4(keccak256("updateTimeLockRequestAndApprove(((uint256,uint256,uint8,(address,address,uint256,uint256,bytes32,uint8,bytes),bytes32,bytes,(address,uint256,address,uint256)),(uint256,uint256,address,bytes4,uint8,uint256,uint256,address),bytes32,bytes,bytes))"));
    
    // Use the structs from MultiPhaseSecureOperation
    // These are now defined in the main library
    
    /**
     * @dev Returns predefined operation types
     * @return Array of operation type definitions
     */
    function getOperationTypes() public pure returns (MultiPhaseSecureOperation.ReadableOperationType[] memory) {
        MultiPhaseSecureOperation.ReadableOperationType[] memory types = new MultiPhaseSecureOperation.ReadableOperationType[](4);
        
        types[0] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("OWNERSHIP_TRANSFER"),
            name: "OWNERSHIP_TRANSFER"
        });
        
        types[1] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("BROADCASTER_UPDATE"),
            name: "BROADCASTER_UPDATE"
        });
        
        types[2] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("RECOVERY_UPDATE"),
            name: "RECOVERY_UPDATE"
        });
        
        types[3] = MultiPhaseSecureOperation.ReadableOperationType({
            operationType: keccak256("TIMELOCK_UPDATE"),
            name: "TIMELOCK_UPDATE"
        });
        
        return types;
    }
    
    /**
     * @dev Returns predefined function schemas
     * @return Array of function schema definitions
     */
    function getFunctionSchemas() public pure returns (MultiPhaseSecureOperation.FunctionSchema[] memory) {
        MultiPhaseSecureOperation.FunctionSchema[] memory schemas = new MultiPhaseSecureOperation.FunctionSchema[](12);
        
        // Meta-transaction function schemas
        MultiPhaseSecureOperation.TxAction[] memory metaApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE;
        metaApproveActions[1] = MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory metaCancelActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL;
        metaCancelActions[1] = MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL;
        
        MultiPhaseSecureOperation.TxAction[] memory metaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](2);
        metaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        metaRequestApproveActions[1] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        // Time-delayed functions
        MultiPhaseSecureOperation.TxAction[] memory timeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory timeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        timeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        
        // Meta-transaction functions
        schemas[0] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipApprovalWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: metaApproveActions
        });
        
        schemas[1] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipCancellationWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: metaCancelActions
        });
        
        schemas[2] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterApprovalWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: metaApproveActions
        });
        
        schemas[3] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterCancellationWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: metaCancelActions
        });
        
        schemas[4] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateRecoveryRequestAndApprove",
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            operationType: RECOVERY_UPDATE,
            supportedActions: metaRequestApproveActions
        });
        
        schemas[5] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateTimeLockRequestAndApprove",
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            operationType: TIMELOCK_UPDATE,
            supportedActions: metaRequestApproveActions
        });
        
        // Time-delayed functions
        schemas[6] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[7] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipDelayedApproval",
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[8] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "transferOwnershipCancellation",
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            operationType: OWNERSHIP_TRANSFER,
            supportedActions: timeDelayCancelActions
        });
        
        schemas[9] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayRequestActions
        });
        
        schemas[10] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterDelayedApproval",
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayApproveActions
        });
        
        schemas[11] = MultiPhaseSecureOperation.FunctionSchema({
            functionName: "updateBroadcasterCancellation",
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            operationType: BROADCASTER_UPDATE,
            supportedActions: timeDelayCancelActions
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
        roleHashes = new bytes32[](19);
        functionPermissions = new MultiPhaseSecureOperation.FunctionPermission[](19);
        
        // Broadcaster role permissions (6 entries)
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL;
        
        MultiPhaseSecureOperation.TxAction[] memory broadcasterMetaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        broadcasterMetaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE;
        
        // Broadcaster: Transfer Ownership Approve Meta
        roleHashes[0] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        functionPermissions[0] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            grantedActions: broadcasterMetaApproveActions
        });
        
        // Broadcaster: Transfer Ownership Cancel Meta
        roleHashes[1] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        functionPermissions[1] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            grantedActions: broadcasterMetaCancelActions
        });
        
        // Broadcaster: Update Broadcaster Approve Meta
        roleHashes[2] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        functionPermissions[2] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            grantedActions: broadcasterMetaApproveActions
        });
        
        // Broadcaster: Update Broadcaster Cancel Meta
        roleHashes[3] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        functionPermissions[3] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            grantedActions: broadcasterMetaCancelActions
        });
        
        // Broadcaster: Update Recovery Meta
        roleHashes[4] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        functionPermissions[4] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            grantedActions: broadcasterMetaRequestApproveActions
        });
        
        // Broadcaster: Update Timelock Meta
        roleHashes[5] = MultiPhaseSecureOperation.BROADCASTER_ROLE;
        functionPermissions[5] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            grantedActions: broadcasterMetaRequestApproveActions
        });
        
        // Owner role permissions (10 entries)
        MultiPhaseSecureOperation.TxAction[] memory ownerTimeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTimeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerTimeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTimeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory ownerTimeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerTimeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;

        MultiPhaseSecureOperation.TxAction[] memory ownerMetaApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE;

        MultiPhaseSecureOperation.TxAction[] memory ownerMetaCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaCancelActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL;

        MultiPhaseSecureOperation.TxAction[] memory ownerMetaRequestApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        ownerMetaRequestApproveActions[0] = MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE;
        
        // Owner: Transfer Ownership Delayed Approval
        roleHashes[6] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[6] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedActions: ownerTimeDelayApproveActions
        });

        // Owner: Transfer Ownership Approve Meta
        roleHashes[7] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[7] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR,
            grantedActions: ownerMetaApproveActions
        });

        // Owner: Transfer Ownership Cancel Meta
        roleHashes[8] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[8] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR,
            grantedActions: ownerMetaCancelActions
        });
        
        // Owner: Update Broadcaster Request
        roleHashes[9] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[9] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR,
            grantedActions: ownerTimeDelayRequestActions
        });
        
        // Owner: Update Broadcaster Delayed Approval
        roleHashes[10] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[10] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR,
            grantedActions: ownerTimeDelayApproveActions
        });
        
        // Owner: Update Broadcaster Cancellation
        roleHashes[11] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[11] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR,
            grantedActions: ownerTimeDelayCancelActions
        });
        
        // Owner: Update Broadcaster Approve Meta
        roleHashes[12] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[12] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR,
            grantedActions: ownerMetaApproveActions
        });
              
        // Owner: Update Broadcaster Cancel Meta
        roleHashes[13] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[13] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR,
            grantedActions: ownerMetaCancelActions
        });
         
        // Owner: Update Recovery Meta
        roleHashes[14] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[14] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_RECOVERY_META_SELECTOR,
            grantedActions: ownerMetaRequestApproveActions
        });

        // Owner: Update Timelock Meta
        roleHashes[15] = MultiPhaseSecureOperation.OWNER_ROLE;
        functionPermissions[15] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR,
            grantedActions: ownerMetaRequestApproveActions
        });
        
        // Recovery role permissions (3 entries)
        MultiPhaseSecureOperation.TxAction[] memory recoveryTimeDelayRequestActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTimeDelayRequestActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST;
        
        MultiPhaseSecureOperation.TxAction[] memory recoveryTimeDelayApproveActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTimeDelayApproveActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE;
        
        MultiPhaseSecureOperation.TxAction[] memory recoveryTimeDelayCancelActions = new MultiPhaseSecureOperation.TxAction[](1);
        recoveryTimeDelayCancelActions[0] = MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL;
        
        // Recovery: Transfer Ownership Request
        roleHashes[16] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        functionPermissions[16] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR,
            grantedActions: recoveryTimeDelayRequestActions
        });
        
        // Recovery: Transfer Ownership Delayed Approval
        roleHashes[17] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        functionPermissions[17] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR,
            grantedActions: recoveryTimeDelayApproveActions
        });
        
        // Recovery: Transfer Ownership Cancellation
        roleHashes[18] = MultiPhaseSecureOperation.RECOVERY_ROLE;
        functionPermissions[18] = MultiPhaseSecureOperation.FunctionPermission({
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR,
            grantedActions: recoveryTimeDelayCancelActions
        });
        
        return IDefinitionContract.RolePermission({
            roleHashes: roleHashes,
            functionPermissions: functionPermissions
        });
    }

        // ============ WORKFLOW INFORMATION STRUCTURES ============
    
    struct WorkflowStep {
        string functionName;
        bytes4 functionSelector;
        MultiPhaseSecureOperation.TxAction action;
        string[] roles;         // CHANGED: Array of roles (e.g., ["OWNER", "RECOVERY"] for OWNER_OR_RECOVERY)
        string description;
        bool isOffChain;        // NEW: Indicates off-chain step
        string phaseType;       // NEW: "SIGNING" or "EXECUTION"
    }
    
    struct WorkflowPath {
        string name;
        string description;
        WorkflowStep[] steps;
        uint8 workflowType; // 0=TIME_DELAY_ONLY, 1=META_TX_ONLY, 2=HYBRID
        uint256 estimatedTimeSec;
        bool requiresSignature;
        bool hasOffChainPhase;  // NEW: Indicates if path has off-chain steps
    }
    
    struct OperationWorkflow {
        bytes32 operationType;
        string operationName;
        WorkflowPath[] paths;
        string[] supportedRoles;
    }
    
    // ============ WORKFLOW INFORMATION FUNCTIONS ============
    
    /**
     * @dev Returns complete workflow information for all SecureOwnable operations
     * @return Array of operation workflows with all possible paths
     */
    function getOperationWorkflows() public pure returns (OperationWorkflow[] memory) {
        OperationWorkflow[] memory workflows = new OperationWorkflow[](4);
        
        workflows[0] = getOwnershipTransferWorkflow();
        workflows[1] = getBroadcasterUpdateWorkflow();
        workflows[2] = getRecoveryUpdateWorkflow();
        workflows[3] = getTimeLockUpdateWorkflow();
        
        return workflows;
    }
    
    /**
     * @dev Returns workflow information for a specific operation type
     * @param operationType The operation type to get workflow for
     * @return Complete workflow information for the operation
     */
    function getWorkflowForOperation(bytes32 operationType) public pure returns (OperationWorkflow memory) {
        if (operationType == OWNERSHIP_TRANSFER) {
            return getOwnershipTransferWorkflow();
        } else if (operationType == BROADCASTER_UPDATE) {
            return getBroadcasterUpdateWorkflow();
        } else if (operationType == RECOVERY_UPDATE) {
            return getRecoveryUpdateWorkflow();
        } else if (operationType == TIMELOCK_UPDATE) {
            return getTimeLockUpdateWorkflow();
        } else {
            revert("Operation type not supported");
        }
    }
    
    /**
     * @dev Returns all available workflow paths for an operation type
     * @param operationType The operation type to get paths for
     * @return Array of workflow paths
     */
    function getWorkflowPaths(bytes32 operationType) public pure returns (WorkflowPath[] memory) {
        OperationWorkflow memory workflow = getWorkflowForOperation(operationType);
        return workflow.paths;
    }
    
    /**
     * @dev Returns workflow information for OWNERSHIP_TRANSFER operation
     * Based on actual sanity test workflows
     * @return Complete workflow information
     */
    function getOwnershipTransferWorkflow() private pure returns (OperationWorkflow memory) {
        WorkflowPath[] memory paths = new WorkflowPath[](4);
        
        // Time-Delay Only Workflow (from sanity tests)
        WorkflowStep[] memory timeDelaySteps = new WorkflowStep[](2);
        string[] memory recoveryRoles = new string[](1);
        recoveryRoles[0] = "RECOVERY";
        timeDelaySteps[0] = WorkflowStep({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR, // 0x572be39b
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: recoveryRoles,
            description: "Recovery creates ownership transfer request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        string[] memory ownerOrRecoveryRoles = new string[](2);
        ownerOrRecoveryRoles[0] = "OWNER";
        ownerOrRecoveryRoles[1] = "RECOVERY";
        timeDelaySteps[1] = WorkflowStep({
            functionName: "transferOwnershipDelayedApproval",
            functionSelector: TRANSFER_OWNERSHIP_DELAYED_APPROVAL_SELECTOR, // 0x6cd71b38
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE, // 1
            roles: ownerOrRecoveryRoles,
            description: "Owner or Recovery approves after time delay",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[0] = WorkflowPath({
            name: "Time-Delay Only",
            description: "Traditional two-phase operation with mandatory waiting period",
            steps: timeDelaySteps,
            workflowType: 0, // TIME_DELAY_ONLY
            estimatedTimeSec: 86400, // 24 hours
            requiresSignature: false,
            hasOffChainPhase: false
        });
        
        // Meta-Transaction Approval Workflow (from sanity tests) - Enhanced with off-chain signing
        WorkflowStep[] memory metaTxSteps = new WorkflowStep[](3); // Changed from 2 to 3
        metaTxSteps[0] = WorkflowStep({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR, // 0x572be39b
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: recoveryRoles,
            description: "Recovery creates ownership transfer request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        string[] memory ownerRoles = new string[](1);
        ownerRoles[0] = "OWNER";
        metaTxSteps[1] = WorkflowStep({
            functionName: "signTransferOwnershipApproval",
            functionSelector: bytes4(0), // No selector for off-chain
            action: MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE, // 4
            roles: ownerRoles,
            description: "Owner signs approval off-chain",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        string[] memory broadcasterRoles = new string[](1);
        broadcasterRoles[0] = "BROADCASTER";
        metaTxSteps[2] = WorkflowStep({
            functionName: "transferOwnershipApprovalWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_APPROVE_META_SELECTOR, // 0xb51ff5ce
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE, // 7
            roles: broadcasterRoles,
            description: "Broadcaster executes signed approval",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[1] = WorkflowPath({
            name: "Meta-Transaction Approval",
            description: "Owner signs approval off-chain, Broadcaster executes on-chain",
            steps: metaTxSteps,
            workflowType: 2, // HYBRID
            estimatedTimeSec: 0, // Immediate execution after signing
            requiresSignature: true,
            hasOffChainPhase: true
        });
        
        // Meta-Transaction Cancellation Workflow (from sanity tests) - Enhanced with off-chain signing
        WorkflowStep[] memory metaCancelSteps = new WorkflowStep[](3); // Changed from 2 to 3
        metaCancelSteps[0] = WorkflowStep({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR, // 0x572be39b
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: recoveryRoles,
            description: "Recovery creates ownership transfer request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        metaCancelSteps[1] = WorkflowStep({
            functionName: "signTransferOwnershipCancellation",
            functionSelector: bytes4(0), // No selector for off-chain
            action: MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL, // 5
            roles: ownerRoles,
            description: "Owner signs cancellation off-chain",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        metaCancelSteps[2] = WorkflowStep({
            functionName: "transferOwnershipCancellationWithMetaTx",
            functionSelector: TRANSFER_OWNERSHIP_CANCEL_META_SELECTOR, // 0x1ef7c2ec
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL, // 8
            roles: broadcasterRoles,
            description: "Broadcaster executes signed cancellation",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[2] = WorkflowPath({
            name: "Meta-Transaction Cancellation",
            description: "Owner signs cancellation off-chain, Broadcaster executes on-chain",
            steps: metaCancelSteps,
            workflowType: 2, // HYBRID
            estimatedTimeSec: 0, // Immediate execution after signing
            requiresSignature: true,
            hasOffChainPhase: true
        });
        
        // Time-Delay Cancellation Workflow (from sanity tests)
        WorkflowStep[] memory timeCancelSteps = new WorkflowStep[](2);
        timeCancelSteps[0] = WorkflowStep({
            functionName: "transferOwnershipRequest",
            functionSelector: TRANSFER_OWNERSHIP_REQUEST_SELECTOR, // 0x572be39b
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: recoveryRoles,
            description: "Recovery creates ownership transfer request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        timeCancelSteps[1] = WorkflowStep({
            functionName: "transferOwnershipCancellation",
            functionSelector: TRANSFER_OWNERSHIP_CANCELLATION_SELECTOR, // 0x9d8f6f90
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL, // 2
            roles: recoveryRoles,
            description: "Recovery cancels pending request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[3] = WorkflowPath({
            name: "Time-Delay Cancellation",
            description: "Cancel pending ownership transfer request after timelock",
            steps: timeCancelSteps,
            workflowType: 0, // TIME_DELAY_ONLY
            estimatedTimeSec: 0, // Immediate (no timelock for cancellation)
            requiresSignature: false,
            hasOffChainPhase: false
        });
        
        string[] memory supportedRoles = new string[](3);
        supportedRoles[0] = "OWNER";
        supportedRoles[1] = "BROADCASTER";
        supportedRoles[2] = "RECOVERY";
        
        return OperationWorkflow({
            operationType: OWNERSHIP_TRANSFER,
            operationName: "OWNERSHIP_TRANSFER",
            paths: paths,
            supportedRoles: supportedRoles
        });
    }
    
    /**
     * @dev Returns workflow information for BROADCASTER_UPDATE operation
     * Based on actual sanity test workflows
     * @return Complete workflow information
     */
    function getBroadcasterUpdateWorkflow() private pure returns (OperationWorkflow memory) {
        WorkflowPath[] memory paths = new WorkflowPath[](4);
        
        // Declare role arrays for reuse
        string[] memory ownerRoles = new string[](1);
        ownerRoles[0] = "OWNER";
        string[] memory broadcasterRoles = new string[](1);
        broadcasterRoles[0] = "BROADCASTER";
        
        // Meta-Transaction Cancellation Workflow (from sanity tests) - Enhanced with off-chain signing
        WorkflowStep[] memory metaCancelSteps = new WorkflowStep[](3); // Changed from 2 to 3
        metaCancelSteps[0] = WorkflowStep({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR, // 0x... (from tests)
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: ownerRoles,
            description: "Owner creates broadcaster update request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        metaCancelSteps[1] = WorkflowStep({
            functionName: "signBroadcasterCancellation",
            functionSelector: bytes4(0), // No selector for off-chain
            action: MultiPhaseSecureOperation.TxAction.SIGN_META_CANCEL, // 5
            roles: ownerRoles,
            description: "Owner signs cancellation off-chain",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        metaCancelSteps[2] = WorkflowStep({
            functionName: "updateBroadcasterCancellationWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_CANCEL_META_SELECTOR, // 0xf1209daa
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_META_CANCEL, // 8
            roles: broadcasterRoles,
            description: "Broadcaster executes signed cancellation",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[0] = WorkflowPath({
            name: "Meta-Transaction Cancellation",
            description: "Owner signs cancellation off-chain, Broadcaster executes on-chain",
            steps: metaCancelSteps,
            workflowType: 2, // HYBRID
            estimatedTimeSec: 0, // Immediate execution after signing
            requiresSignature: true,
            hasOffChainPhase: true
        });
        
        // Time-Delay Cancellation Workflow (from sanity tests)
        WorkflowStep[] memory timeCancelSteps = new WorkflowStep[](2);
        timeCancelSteps[0] = WorkflowStep({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR, // 0x... (from tests)
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: ownerRoles,
            description: "Owner creates broadcaster update request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        timeCancelSteps[1] = WorkflowStep({
            functionName: "updateBroadcasterCancellation",
            functionSelector: UPDATE_BROADCASTER_CANCELLATION_SELECTOR, // 0x62544d90
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_CANCEL, // 2
            roles: ownerRoles,
            description: "Owner cancels pending request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[1] = WorkflowPath({
            name: "Time-Delay Cancellation",
            description: "Cancel pending broadcaster update request after timelock",
            steps: timeCancelSteps,
            workflowType: 0, // TIME_DELAY_ONLY
            estimatedTimeSec: 0, // Immediate (no timelock for cancellation)
            requiresSignature: false,
            hasOffChainPhase: false
        });
        
        // Meta-Transaction Approval Workflow (from sanity tests) - Enhanced with off-chain signing
        WorkflowStep[] memory metaTxSteps = new WorkflowStep[](3); // Changed from 2 to 3
        metaTxSteps[0] = WorkflowStep({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR, // 0x... (from tests)
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: ownerRoles,
            description: "Owner creates broadcaster update request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        metaTxSteps[1] = WorkflowStep({
            functionName: "signBroadcasterApproval",
            functionSelector: bytes4(0), // No selector for off-chain
            action: MultiPhaseSecureOperation.TxAction.SIGN_META_APPROVE, // 4
            roles: ownerRoles,
            description: "Owner signs approval off-chain",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        metaTxSteps[2] = WorkflowStep({
            functionName: "updateBroadcasterApprovalWithMetaTx",
            functionSelector: UPDATE_BROADCASTER_APPROVE_META_SELECTOR, // 0xd04d6238
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_META_APPROVE, // 7
            roles: broadcasterRoles,
            description: "Broadcaster executes signed approval",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[2] = WorkflowPath({
            name: "Meta-Transaction Approval",
            description: "Owner signs approval off-chain, Broadcaster executes on-chain",
            steps: metaTxSteps,
            workflowType: 2, // HYBRID
            estimatedTimeSec: 0, // Immediate execution after signing
            requiresSignature: true,
            hasOffChainPhase: true
        });
        
        // Time-Delay Approval Workflow (from sanity tests)
        WorkflowStep[] memory timeDelaySteps = new WorkflowStep[](2);
        timeDelaySteps[0] = WorkflowStep({
            functionName: "updateBroadcasterRequest",
            functionSelector: UPDATE_BROADCASTER_REQUEST_SELECTOR, // 0x... (from tests)
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_REQUEST, // 0
            roles: ownerRoles,
            description: "Owner creates broadcaster update request",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        timeDelaySteps[1] = WorkflowStep({
            functionName: "updateBroadcasterDelayedApproval",
            functionSelector: UPDATE_BROADCASTER_DELAYED_APPROVAL_SELECTOR, // 0xb7d254d6
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_TIME_DELAY_APPROVE, // 1
            roles: ownerRoles,
            description: "Owner approves after time delay",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[3] = WorkflowPath({
            name: "Time-Delay Approval",
            description: "Traditional two-phase operation with mandatory waiting period",
            steps: timeDelaySteps,
            workflowType: 0, // TIME_DELAY_ONLY
            estimatedTimeSec: 86400, // 24 hours
            requiresSignature: false,
            hasOffChainPhase: false
        });
        
        string[] memory supportedRoles = new string[](2);
        supportedRoles[0] = "OWNER";
        supportedRoles[1] = "BROADCASTER";
        
        return OperationWorkflow({
            operationType: BROADCASTER_UPDATE,
            operationName: "BROADCASTER_UPDATE",
            paths: paths,
            supportedRoles: supportedRoles
        });
    }
    
    /**
     * @dev Returns workflow information for RECOVERY_UPDATE operation
     * Based on actual sanity test workflows
     * @return Complete workflow information
     */
    function getRecoveryUpdateWorkflow() private pure returns (OperationWorkflow memory) {
        WorkflowPath[] memory paths = new WorkflowPath[](1);
        
        // Declare role arrays for reuse
        string[] memory ownerRoles = new string[](1);
        ownerRoles[0] = "OWNER";
        string[] memory broadcasterRoles = new string[](1);
        broadcasterRoles[0] = "BROADCASTER";
        
        // Single-Phase Meta-Transaction Workflow (from sanity tests) - Enhanced with off-chain signing
        WorkflowStep[] memory singlePhaseSteps = new WorkflowStep[](2); // Changed from 1 to 2
        singlePhaseSteps[0] = WorkflowStep({
            functionName: "signRecoveryRequestAndApprove",
            functionSelector: bytes4(0), // No selector for off-chain
            action: MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE, // 3
            roles: ownerRoles,
            description: "Owner signs request and approval off-chain",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        singlePhaseSteps[1] = WorkflowStep({
            functionName: "updateRecoveryRequestAndApprove",
            functionSelector: UPDATE_RECOVERY_META_SELECTOR, // 0x2aa09cf6
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE, // 6
            roles: broadcasterRoles,
            description: "Broadcaster executes signed request and approval",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[0] = WorkflowPath({
            name: "Single-Phase Meta-Transaction",
            description: "Owner signs request and approval off-chain, Broadcaster executes on-chain",
            steps: singlePhaseSteps,
            workflowType: 1, // META_TX_ONLY
            estimatedTimeSec: 0, // Immediate execution after signing
            requiresSignature: true,
            hasOffChainPhase: true
        });
        
        string[] memory supportedRoles = new string[](1);
        supportedRoles[0] = "BROADCASTER";
        
        return OperationWorkflow({
            operationType: RECOVERY_UPDATE,
            operationName: "RECOVERY_UPDATE",
            paths: paths,
            supportedRoles: supportedRoles
        });
    }
    
    /**
     * @dev Returns workflow information for TIMELOCK_UPDATE operation
     * Based on actual sanity test workflows
     * @return Complete workflow information
     */
    function getTimeLockUpdateWorkflow() private pure returns (OperationWorkflow memory) {
        WorkflowPath[] memory paths = new WorkflowPath[](1);
        
        // Declare role arrays for reuse
        string[] memory ownerRoles = new string[](1);
        ownerRoles[0] = "OWNER";
        string[] memory broadcasterRoles = new string[](1);
        broadcasterRoles[0] = "BROADCASTER";
        
        // Single-Phase Meta-Transaction Workflow (from sanity tests) - Enhanced with off-chain signing
        WorkflowStep[] memory singlePhaseSteps = new WorkflowStep[](2); // Changed from 1 to 2
        singlePhaseSteps[0] = WorkflowStep({
            functionName: "signTimeLockRequestAndApprove",
            functionSelector: bytes4(0), // No selector for off-chain
            action: MultiPhaseSecureOperation.TxAction.SIGN_META_REQUEST_AND_APPROVE, // 3
            roles: ownerRoles,
            description: "Owner signs request and approval off-chain",
            isOffChain: true,
            phaseType: "SIGNING"
        });
        singlePhaseSteps[1] = WorkflowStep({
            functionName: "updateTimeLockRequestAndApprove",
            functionSelector: UPDATE_TIMELOCK_META_SELECTOR, // 0x... (from tests)
            action: MultiPhaseSecureOperation.TxAction.EXECUTE_META_REQUEST_AND_APPROVE, // 6
            roles: broadcasterRoles,
            description: "Broadcaster executes signed request and approval",
            isOffChain: false,
            phaseType: "EXECUTION"
        });
        
        paths[0] = WorkflowPath({
            name: "Single-Phase Meta-Transaction",
            description: "Owner signs request and approval off-chain, Broadcaster executes on-chain",
            steps: singlePhaseSteps,
            workflowType: 1, // META_TX_ONLY
            estimatedTimeSec: 0, // Immediate execution after signing
            requiresSignature: true,
            hasOffChainPhase: true
        });
        
        string[] memory supportedRoles = new string[](1);
        supportedRoles[0] = "BROADCASTER";
        
        return OperationWorkflow({
            operationType: TIMELOCK_UPDATE,
            operationName: "TIMELOCK_UPDATE",
            paths: paths,
            supportedRoles: supportedRoles
        });
    }
}
