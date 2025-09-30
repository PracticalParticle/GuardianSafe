# Solidity API

# IWorkflow

Interface for workflow contracts that provide operation workflow definitions

This interface allows contracts to dynamically load their workflow configuration from external
workflow contracts, enabling modular and extensible workflow management.

Workflow contracts should implement this interface to provide:
- Workflow step definitions (individual steps in a workflow)
- Workflow path definitions (complete execution paths)
- Operation workflow definitions (workflows for specific operations)




## Functions

### getOperationWorkflows

```solidity
function getOperationWorkflows() external pure returns (struct IWorkflow.OperationWorkflow[])
```

Returns all operation workflows


**Returns:**
- Array of operation workflow definitions


---

### getWorkflowForOperation

```solidity
function getWorkflowForOperation(bytes32 operationType) external pure returns (struct IWorkflow.OperationWorkflow)
```

Returns workflow information for a specific operation type

**Parameters:**
- `` (): The operation type hash to get workflow for

**Returns:**
- OperationWorkflow struct containing workflow information for the operation


---

### getWorkflowPaths

```solidity
function getWorkflowPaths() external pure returns (struct IWorkflow.WorkflowPath[])
```

Returns all available workflow paths


**Returns:**
- Array of workflow path definitions


---


## Events


## Structs


## Enums


