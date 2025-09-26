import { Address, Hex } from 'viem';
import { TransactionOptions } from './base.index';
import { 
  ReadableOperationType, 
  FunctionSchema, 
  RolePermission, 
  OperationWorkflow, 
  WorkflowPath 
} from '../types/definition.index';

/**
 * TypeScript interface for IDefinition
 * This interface allows interaction with any definition library that implements IDefinition.sol
 */
export interface IDefinition {
  /**
   * Returns all operation type definitions
   * @returns Array of operation type definitions
   */
  getOperationTypes(): Promise<ReadableOperationType[]>;
  
  /**
   * Returns all function schema definitions
   * @returns Array of function schema definitions
   */
  getFunctionSchemas(): Promise<FunctionSchema[]>;
  
  /**
   * Returns all role hashes and their corresponding function permissions
   * @returns RolePermission struct containing roleHashes and functionPermissions arrays
   */
  getRolePermissions(): Promise<RolePermission>;
  
  /**
   * Returns all operation workflows
   * @returns Array of operation workflow definitions
   */
  getOperationWorkflows(): Promise<OperationWorkflow[]>;
  
  /**
   * Returns workflow information for a specific operation type
   * @param operationType The operation type hash to get workflow for
   * @returns OperationWorkflow struct containing workflow information for the operation
   */
  getWorkflowForOperation(operationType: Hex): Promise<OperationWorkflow>;
  
  /**
   * Returns all available workflow paths
   * @returns Array of workflow path definitions
   */
  getWorkflowPaths(): Promise<WorkflowPath[]>;
}

/**
 * Configuration options for Definitions client
 */
export interface DefinitionsConfig {
  contractAddress: Address;
  chainId: number;
  rpcUrl?: string;
}


/**
 * Result of contract method calls
 */
export interface ContractResult<T> {
  data: T;
  blockNumber: bigint;
  transactionHash: Hex;
}
