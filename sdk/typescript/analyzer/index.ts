// SPDX-License-Identifier: MPL-2.0
// Guardian Workflow Analyzer - Main Export

export { WorkflowAnalyzer } from './WorkflowAnalyzer'
export { ContractDefinitionAnalyzer } from './ContractDefinitionAnalyzer'
export { WorkflowValidator } from './WorkflowValidator'
export { ContractIntegrityValidator } from './ContractIntegrityValidator'
export { ContractInitializationValidator } from './ContractInitializationValidator'
export { ConfigurationManager, DEFAULT_CONFIG, PREDEFINED_NETWORKS } from './Configuration'
export type { AnalyzerConfig, NetworkConfig, DefinitionLibraryConfig } from './Configuration'

// Re-export types
export type {
  Address,
  DefinitionType,
  OperationType,
  WorkflowType,
  TxAction,
  TxStatus,
  RoleType,
  OperationTypeDefinition,
  FunctionSchemaDefinition,
  RolePermissionDefinition,
  ContractAnalysis,
  Workflow,
  Operation,
  FunctionSchema,
  RolePermission,
  StateTransition,
  Parameter,
  ValidationResult,
  ComplianceResult,
  ComplianceViolation,
  ExecutionParams,
  MetaTransactionData,
  ExecutionResult,
  TestResult,
  FuzzResult,
  EdgeCaseResult,
  BoundaryResult
} from '../types/WorkflowTypes'

export type { WorkflowStatistics } from '../types/WorkflowTypes'
