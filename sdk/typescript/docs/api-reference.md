# API Reference

Complete reference for all Guardian TypeScript SDK classes, methods, and types.

## 📚 **Core Classes**

### **SecureOwnable**

The `SecureOwnable` class provides type-safe access to SecureOwnable contracts.

#### **Constructor**

```typescript
constructor(
  client: PublicClient,
  walletClient?: WalletClient,
  contractAddress: Address,
  chain: Chain
)
```

**Parameters:**
- `client`: Viem public client for read operations
- `walletClient`: Optional wallet client for write operations
- `contractAddress`: Address of the deployed contract
- `chain`: Chain configuration

#### **Read Methods**

##### `owner(): Promise<Address>`
Returns the current owner of the contract.

```typescript
const owner = await secureOwnable.owner()
```

##### `getTimeLockPeriodSec(): Promise<bigint>`
Returns the time lock period in seconds.

```typescript
const period = await secureOwnable.getTimeLockPeriodSec()
```

##### `broadcaster(): Promise<Address>`
Returns the current broadcaster address.

```typescript
const broadcaster = await secureOwnable.broadcaster()
```

##### `recovery(): Promise<Address>`
Returns the current recovery address.

```typescript
const recovery = await secureOwnable.recovery()
```

##### `eventForwarder(): Promise<Address>`
Returns the current event forwarder address.

```typescript
const forwarder = await secureOwnable.eventForwarder()
```

##### `isInitialized(): Promise<boolean>`
Checks if the contract is initialized.

```typescript
const initialized = await secureOwnable.isInitialized()
```

#### **Write Methods**

##### `transferOwnershipRequest(newOwner: Address, options?: TransactionOptions): Promise<Hash>`
Requests a transfer of ownership.

```typescript
const txHash = await secureOwnable.transferOwnershipRequest(
  '0x...',
  { from: account.address }
)
```

##### `transferOwnershipDelayedApproval(txId: bigint, options?: TransactionOptions): Promise<Hash>`
Approves a delayed ownership transfer.

```typescript
const txHash = await secureOwnable.transferOwnershipDelayedApproval(
  1n,
  { from: account.address }
)
```

##### `updateBroadcasterRequest(newBroadcaster: Address, options?: TransactionOptions): Promise<Hash>`
Requests a broadcaster update.

```typescript
const txHash = await secureOwnable.updateBroadcasterRequest(
  '0x...',
  { from: account.address }
)
```

##### `updateRecoveryRequestAndApprove(newRecovery: Address, options?: TransactionOptions): Promise<Hash>`
Requests and approves a recovery update.

```typescript
const txHash = await secureOwnable.updateRecoveryRequestAndApprove(
  '0x...',
  { from: account.address }
)
```

##### `updateTimeLockRequestAndApprove(newPeriod: bigint, options?: TransactionOptions): Promise<Hash>`
Requests and approves a time lock period update.

```typescript
const txHash = await secureOwnable.updateTimeLockRequestAndApprove(
  3600n, // 1 hour
  { from: account.address }
)
```

### **DynamicRBAC**

The `DynamicRBAC` class provides type-safe access to DynamicRBAC contracts.

#### **Constructor**

```typescript
constructor(
  client: PublicClient,
  walletClient?: WalletClient,
  contractAddress: Address,
  chain: Chain
)
```

#### **Read Methods**

##### `roleEditingEnabled(): Promise<boolean>`
Checks if role editing is enabled.

```typescript
const enabled = await dynamicRBAC.roleEditingEnabled()
```

##### `getRole(roleHash: string): Promise<Role>`
Gets role information by hash.

```typescript
const role = await dynamicRBAC.getRole('0x...')
```

##### `hasRole(account: Address, roleHash: string): Promise<boolean>`
Checks if an account has a specific role.

```typescript
const hasRole = await dynamicRBAC.hasRole('0x...', '0x...')
```

##### `getRoleCount(): Promise<bigint>`
Returns the total number of roles.

```typescript
const count = await dynamicRBAC.getRoleCount()
```

#### **Write Methods**

##### `updateRoleEditingToggleRequestAndApprove(enabled: boolean, options?: TransactionOptions): Promise<Hash>`
Requests and approves role editing toggle.

```typescript
const txHash = await dynamicRBAC.updateRoleEditingToggleRequestAndApprove(
  true,
  { from: account.address }
)
```

## 🔍 **Workflow Analyzer**

### **WorkflowAnalyzer**

The main class for analyzing Guardian contracts and workflows.

#### **Constructor**

```typescript
constructor(client: PublicClient)
```

#### **Methods**

##### `analyzeContract(contractAddress: Address): Promise<ContractAnalysis>`
Analyzes a Guardian contract and returns comprehensive analysis.

```typescript
const analysis = await analyzer.analyzeContract('0x...')
```

**Returns:**
```typescript
interface ContractAnalysis {
  contractAddress: Address
  definitionType: DefinitionType
  operationTypes: OperationTypeDefinition[]
  functionSchemas: FunctionSchemaDefinition[]
  rolePermissions: RolePermissionDefinition[]
  workflows: Workflow[]
  complianceScore: number
  analysisTimestamp: number
}
```

##### `generateWorkflows(contractAddress: Address): Promise<Workflow[]>`
Generates all possible workflows for a contract.

```typescript
const workflows = await analyzer.generateWorkflows('0x...')
```

##### `validateWorkflow(workflow: Workflow): ValidationResult`
Validates a workflow for correctness.

```typescript
const validation = analyzer.validateWorkflow(workflow)
```

##### `checkProtocolCompliance(contractAddress: Address): Promise<ComplianceResult>`
Checks contract compliance with Guardian protocol.

```typescript
const compliance = await analyzer.checkProtocolCompliance('0x...')
```

##### `analyzeWorkflowStatistics(workflows: Workflow[]): WorkflowStatistics`
Analyzes workflow statistics.

```typescript
const stats = analyzer.analyzeWorkflowStatistics(workflows)
```

### **ContractDefinitionAnalyzer**

Analyzes contracts by calling deployed definition libraries.

#### **Constructor**

```typescript
constructor(client: PublicClient)
```

#### **Methods**

##### `analyzeContract(contractAddress: Address): Promise<ContractAnalysis>`
Analyzes a contract using definition libraries.

##### `generateWorkflows(analysis: ContractAnalysis): Workflow[]`
Generates workflows from contract analysis.

### **WorkflowValidator**

Validates workflows and their configurations.

#### **Methods**

##### `validateWorkflow(workflow: Workflow): ValidationResult`
Validates a single workflow.

##### `validateWorkflowSequences(workflows: Workflow[]): ValidationResult[]`
Validates multiple workflows.

##### `classifyWorkflow(workflow: Workflow): WorkflowType`
Classifies a workflow by type.

##### `detectBrokenWorkflows(workflows: Workflow[]): Workflow[]`
Detects broken or invalid workflows.

## 📝 **Types & Interfaces**

### **Core Types**

```typescript
type Address = `0x${string}`
type Hash = `0x${string}`

type DefinitionType = 
  | 'SecureOwnable'
  | 'MultiPhaseSecureOperation'
  | 'DynamicRBAC'
  | 'Generic'

type WorkflowType = 
  | 'TIME_DELAY_ONLY'
  | 'META_TX_ONLY'
  | 'HYBRID'
  | 'BROKEN'

type OperationType = 
  | 'OWNERSHIP_TRANSFER'
  | 'BROADCASTER_UPDATE'
  | 'RECOVERY_UPDATE'
  | 'TIMELOCK_UPDATE'
  | 'ROLE_EDITING_TOGGLE'
  | 'CUSTOM'

type TxAction = 
  | 'EXECUTE_TIME_DELAY_REQUEST'
  | 'EXECUTE_TIME_DELAY_APPROVE'
  | 'EXECUTE_META_REQUEST_AND_APPROVE'
  | 'EXECUTE_META_APPROVE'

type TxStatus = 
  | 'UNDEFINED'
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
```

### **Contract Analysis**

```typescript
interface ContractAnalysis {
  contractAddress: Address
  definitionType: DefinitionType
  operationTypes: OperationTypeDefinition[]
  functionSchemas: FunctionSchemaDefinition[]
  rolePermissions: RolePermissionDefinition[]
  workflows: Workflow[]
  complianceScore: number
  analysisTimestamp: number
}

interface OperationTypeDefinition {
  name: string
  description: string
  supportedActions: TxAction[]
  requiredRoles: string[]
}

interface FunctionSchemaDefinition {
  functionName: string
  functionSelector: string
  operationType: OperationType
  supportedActions: TxAction[]
  parameters: Parameter[]
}

interface RolePermissionDefinition {
  roleHash: string
  functionSelector: string
  grantedActions: TxAction[]
  conditions: string[]
}
```

### **Workflow Types**

```typescript
interface Workflow {
  id: string
  name: string
  type: WorkflowType
  isValid: boolean
  validationErrors: string[]
  operations: Operation[]
  stateTransitions: StateTransition[]
  description: string
}

interface Operation {
  type: OperationType
  name: string
  description: string
  functions: FunctionSchema[]
  roles: RolePermission[]
  requiredActions: TxAction[]
  status: TxStatus
}

interface StateTransition {
  from: TxStatus
  to: TxStatus
  conditions: string[]
  requiredActions: TxAction[]
}
```

### **Validation & Compliance**

```typescript
interface ValidationResult {
  isValid: boolean
  score: number
  errors: string[]
  warnings: string[]
}

interface ComplianceResult {
  isCompliant: boolean
  score: number
  violations: ComplianceViolation[]
  recommendations: string[]
}

interface ComplianceViolation {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  recommendation: string
  code: string
}
```

### **Statistics**

```typescript
interface WorkflowStatistics {
  totalWorkflows: number
  validWorkflows: number
  brokenWorkflows: number
  totalOperations: number
  totalStateTransitions: number
  averageOperationsPerWorkflow: number
  averageStateTransitionsPerWorkflow: number
  workflowTypes: Record<WorkflowType, number>
}
```

## 🔧 **Transaction Options**

```typescript
interface TransactionOptions {
  from?: Address
  value?: bigint
  gas?: bigint
  gasPrice?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: number
}
```

## 📊 **Error Types**

```typescript
class GuardianError extends Error {
  code: string
  details?: any
}

class ContractError extends GuardianError {
  contractAddress: Address
  method: string
}

class ValidationError extends GuardianError {
  field: string
  value: any
}

class ComplianceError extends GuardianError {
  violation: ComplianceViolation
}
```

## 🎯 **Usage Examples**

### **Basic Contract Interaction**

```typescript
import { SecureOwnable } from '@guardian/sdk/typescript'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

const secureOwnable = new SecureOwnable(
  client,
  undefined,
  '0x...',
  mainnet
)

// Read operations
const owner = await secureOwnable.owner()
const timeLock = await secureOwnable.getTimeLockPeriodSec()

console.log('Owner:', owner)
console.log('Time lock period:', timeLock)
```

### **Workflow Analysis**

```typescript
import { WorkflowAnalyzer } from '@guardian/sdk/typescript/analyzer'

const analyzer = new WorkflowAnalyzer(client)

// Analyze contract
const analysis = await analyzer.analyzeContract('0x...')
console.log('Definition type:', analysis.definitionType)
console.log('Compliance score:', analysis.complianceScore)

// Generate workflows
const workflows = await analyzer.generateWorkflows('0x...')
workflows.forEach(workflow => {
  console.log(`${workflow.name}: ${workflow.type}`)
})
```

---

**Need more details?** Check out the specific guides:
- [SecureOwnable Guide](./secure-ownable.md)
- [DynamicRBAC Guide](./dynamic-rbac.md)
- [Analyzer Overview](./analyzer-overview.md)
