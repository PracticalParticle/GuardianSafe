import { Hex } from 'viem';
import { TxAction } from './lib.index';

/**
 * TypeScript types for IDefinitionContract interface
 * These types correspond to the Solidity structs in IDefinitionContract.sol
 */

/**
 * Function permission structure
 */
export interface FunctionPermission {
  functionSelector: Hex;
  allowedRoles: Hex[];
  requiresSignature: boolean;
  isOffChain: boolean;
}

/**
 * Function schema structure
 */
export interface FunctionSchema {
  functionName: string;
  functionSelector: Hex;
  parameters: string[];
  returnTypes: string[];
  description: string;
}

/**
 * Role permission structure containing role hashes and their function permissions
 */
export interface RolePermission {
  roleHashes: Hex[];
  functionPermissions: FunctionPermission[];
}

/**
 * Single step in a workflow
 */
export interface WorkflowStep {
  functionName: string;
  functionSelector: Hex;
  action: TxAction;
  roles: string[];
  description: string;
  isOffChain: boolean;
  phaseType: string;
}

/**
 * Complete workflow path
 */
export interface WorkflowPath {
  name: string;
  description: string;
  steps: WorkflowStep[];
  workflowType: number; // 0=TIME_DELAY_ONLY, 1=META_TX_ONLY, 2=HYBRID
  estimatedTimeSec: bigint;
  requiresSignature: boolean;
  hasOffChainPhase: boolean;
}

/**
 * Complete operation workflow
 */
export interface OperationWorkflow {
  operationType: Hex;
  operationName: string;
  paths: WorkflowPath[];
  supportedRoles: string[];
}

/**
 * Readable operation type (from StateAbstraction)
 */
export interface ReadableOperationType {
  operationType: Hex;
  name: string;
}

/**
 * Workflow type constants
 */
export const WorkflowType = {
  TIME_DELAY_ONLY: 0,
  META_TX_ONLY: 1,
  HYBRID: 2
} as const;

export type WorkflowType = typeof WorkflowType[keyof typeof WorkflowType];

/**
 * Phase type constants
 */
export const PhaseType = {
  SIGNING: "SIGNING",
  EXECUTION: "EXECUTION"
} as const;

export type PhaseType = typeof PhaseType[keyof typeof PhaseType];
