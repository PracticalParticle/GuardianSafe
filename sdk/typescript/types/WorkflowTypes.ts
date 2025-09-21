// SPDX-License-Identifier: MPL-2.0
// Core Workflow Analysis Types for Guardian SDK

export type Address = `0x${string}`

// Definition Types
export type DefinitionType = 'SecureOwnable' | 'MultiPhaseSecureOperation' | 'DynamicRBAC' | 'Generic'

// Operation Types
export type OperationType = 
  | 'OWNERSHIP_TRANSFER'
  | 'BROADCASTER_UPDATE'
  | 'RECOVERY_UPDATE'
  | 'TIMELOCK_UPDATE'
  | 'ROLE_EDITING_TOGGLE'
  | 'SYSTEM_OPERATION'
  | 'CUSTOM'

// Workflow Types
export type WorkflowType = 
  | 'TIME_DELAY_ONLY'     // Traditional two-phase: REQUEST → APPROVE (both time-delay)
  | 'META_TX_ONLY'        // Single meta-transaction: REQUEST_AND_APPROVE
  | 'HYBRID'              // Mixed patterns: REQUEST (time-delay) → APPROVE (meta-tx) OR both options available
  | 'BROKEN'              // Invalid workflow configuration

// Transaction Actions
export type TxAction = 
  | 'EXECUTE_TIME_DELAY_REQUEST'
  | 'EXECUTE_TIME_DELAY_APPROVE'
  | 'EXECUTE_TIME_DELAY_CANCEL'
  | 'SIGN_META_APPROVE'
  | 'EXECUTE_META_APPROVE'
  | 'SIGN_META_CANCEL'
  | 'EXECUTE_META_CANCEL'
  | 'SIGN_META_REQUEST_AND_APPROVE'
  | 'EXECUTE_META_REQUEST_AND_APPROVE'

// Transaction Status
export type TxStatus = 'UNDEFINED' | 'PENDING' | 'COMPLETED' | 'CANCELLED'

// Role Types
export type RoleType = 'OWNER_ROLE' | 'BROADCASTER_ROLE' | 'RECOVERY_ROLE' | 'CUSTOM_ROLE'

// Core Structures
export interface OperationTypeDefinition {
  operationType: string
  name: string
}

export interface FunctionSchemaDefinition {
  functionName: string
  functionSelector: string
  operationType: string
  supportedActions: number[]
}

export interface RolePermissionDefinition {
  roleHash: string
  functionSelector: string
  grantedActions: number[]
}

// Analysis Results
export interface ContractAnalysis {
  contractAddress: Address
  definitionType: DefinitionType
  operationTypes: OperationTypeDefinition[]
  functionSchemas: FunctionSchemaDefinition[]
  rolePermissions: RolePermissionDefinition[]
  workflows: Workflow[]
  complianceScore: number
  analysisTimestamp: number
}

export interface Workflow {
  id: string
  name: string
  type: WorkflowType
  contractAddress: Address
  operations: Operation[]
  stateTransitions: StateTransition[]
  isValid: boolean
  validationErrors: string[]
}

export interface Operation {
  id: string
  type: OperationType
  functions: FunctionSchema[]
  roles: RolePermission[]
  requiredActions: TxAction[]
  stateTransitions: StateTransition[]
}

export interface FunctionSchema {
  name: string
  selector: string
  operationType: OperationType
  supportedActions: TxAction[]
  parameters: Parameter[]
}

export interface RolePermission {
  roleHash: string
  roleName: string
  functionSelector: string
  grantedActions: TxAction[]
}

export interface StateTransition {
  from: TxStatus
  to: TxStatus
  conditions: string[]
  requiredActions: TxAction[]
}

export interface Parameter {
  name: string
  type: string
  required: boolean
  description?: string
}

// Validation Results
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number
}

export interface ComplianceResult {
  isCompliant: boolean
  score: number
  violations: ComplianceViolation[]
  recommendations: string[]
}

export interface ComplianceViolation {
  type: 'MISSING_FUNCTION' | 'INVALID_ROLE' | 'INVALID_OPERATION' | 'PROTOCOL_VIOLATION'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  recommendation: string
}

// Execution Types
export interface ExecutionParams {
  operationType: OperationType
  functionName: string
  parameters: any[]
  role: RoleType
  metaTransaction?: MetaTransactionData
}

export interface MetaTransactionData {
  from: Address
  to: Address
  value: bigint
  data: string
  signature: string
}

export interface ExecutionResult {
  success: boolean
  transactionHash?: string
  error?: string
  gasUsed?: bigint
  executionTime: number
}

// Testing Types
export interface TestResult {
  testName: string
  passed: boolean
  error?: string
  executionTime: number
  gasUsed?: bigint
}

export interface FuzzResult {
  input: any
  passed: boolean
  error?: string
  executionTime: number
}

export interface EdgeCaseResult {
  caseName: string
  passed: boolean
  error?: string
  description: string
}

export interface BoundaryResult {
  boundary: string
  passed: boolean
  error?: string
  value: any
}

// Workflow Statistics
export interface WorkflowStatistics {
  totalWorkflows: number
  validWorkflows: number
  brokenWorkflows: number
  workflowTypes: Record<WorkflowType, number>
  totalOperations: number
  totalStateTransitions: number
  averageOperationsPerWorkflow: number
  averageStateTransitionsPerWorkflow: number
}
