# Workflow Analyzer Overview

The Guardian Workflow Analyzer is a powerful tool for analyzing Guardian protocol contracts, generating workflows, and ensuring protocol compliance.

## 🎯 **What is the Workflow Analyzer?**

The Workflow Analyzer is a comprehensive analysis system that:

- **Analyzes Guardian contracts** by calling deployed definition libraries
- **Generates workflows** from contract definitions and supported actions
- **Validates workflows** for correctness and protocol compliance
- **Detects broken workflows** and provides recommendations
- **Provides compliance scoring** against Guardian protocol standards

## 🏗️ **Architecture**

### **Core Components**

```
WorkflowAnalyzer (Main Orchestrator)
├── ContractDefinitionAnalyzer (Contract Analysis)
├── WorkflowValidator (Workflow Validation)
└── Definition Libraries (On-chain Data)
    ├── SecureOwnableDefinitions
    ├── MultiPhaseSecureOperationDefinitions
    └── DynamicRBACDefinitions
```

### **Data Flow**

```
Contract Address → ContractDefinitionAnalyzer → Definition Libraries → Contract Analysis
                                                      ↓
Workflow Generation ← WorkflowValidator ← Generated Workflows
```

## 🚀 **Quick Start**

```typescript
import { WorkflowAnalyzer } from '@guardian/sdk/typescript/analyzer'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// Initialize client
const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

// Create analyzer
const analyzer = new WorkflowAnalyzer(client)

// Analyze a contract
const analysis = await analyzer.analyzeContract('0x...')
console.log('Contract Analysis:', analysis)
```

## 📊 **Analysis Types**

### **1. Contract Analysis**

Analyzes a Guardian contract and returns comprehensive information:

```typescript
interface ContractAnalysis {
  contractAddress: Address
  definitionType: DefinitionType // 'SecureOwnable', 'DynamicRBAC', etc.
  operationTypes: OperationTypeDefinition[]
  functionSchemas: FunctionSchemaDefinition[]
  rolePermissions: RolePermissionDefinition[]
  workflows: Workflow[]
  complianceScore: number
  analysisTimestamp: number
}
```

**Example:**
```typescript
const analysis = await analyzer.analyzeContract('0x...')

console.log('Definition Type:', analysis.definitionType)
console.log('Operation Types:', analysis.operationTypes.length)
console.log('Function Schemas:', analysis.functionSchemas.length)
console.log('Role Permissions:', analysis.rolePermissions.length)
console.log('Compliance Score:', analysis.complianceScore)
```

### **2. Workflow Generation**

Generates all possible workflows for a contract:

```typescript
const workflows = await analyzer.generateWorkflows('0x...')

workflows.forEach(workflow => {
  console.log(`Workflow: ${workflow.name}`)
  console.log(`- Type: ${workflow.type}`)
  console.log(`- Valid: ${workflow.isValid}`)
  console.log(`- Operations: ${workflow.operations.length}`)
})
```

### **3. Workflow Validation**

Validates workflows for correctness:

```typescript
const validation = analyzer.validateWorkflow(workflow)

console.log('Validation Result:', {
  isValid: validation.isValid,
  score: validation.score,
  errors: validation.errors,
  warnings: validation.warnings
})
```

### **4. Protocol Compliance**

Checks contract compliance with Guardian protocol:

```typescript
const compliance = await analyzer.checkProtocolCompliance('0x...')

console.log('Compliance Result:', {
  isCompliant: compliance.isCompliant,
  score: compliance.score,
  violations: compliance.violations.length,
  recommendations: compliance.recommendations.length
})
```

## 🔍 **Workflow Types**

The analyzer classifies workflows into four types:

### **1. TIME_DELAY_ONLY**
Traditional two-phase workflows with time delays:
- **Request Phase**: `EXECUTE_TIME_DELAY_REQUEST`
- **Approval Phase**: `EXECUTE_TIME_DELAY_APPROVE`

**Example**: Ownership transfer with time lock

### **2. META_TX_ONLY**
Single meta-transaction workflows:
- **Single Phase**: `EXECUTE_META_REQUEST_AND_APPROVE`

**Example**: Recovery update with immediate approval

### **3. HYBRID**
Mixed workflow patterns:
- **Option 1**: Request (time-delay) → Approve (meta-tx)
- **Option 2**: Both time-delay and meta-tx options available

**Example**: Broadcaster update with multiple approval options

### **4. BROKEN**
Invalid workflow configurations that cannot be executed

## 📈 **Workflow Statistics**

Analyze workflow statistics for insights:

```typescript
const stats = analyzer.analyzeWorkflowStatistics(workflows)

console.log('Workflow Statistics:', {
  totalWorkflows: stats.totalWorkflows,
  validWorkflows: stats.validWorkflows,
  brokenWorkflows: stats.brokenWorkflows,
  averageOperationsPerWorkflow: stats.averageOperationsPerWorkflow,
  workflowTypes: stats.workflowTypes
})
```

## 🛠️ **Advanced Usage**

### **Batch Analysis**

```typescript
const contracts = [
  '0x...', // GuardianAccountAbstraction
  '0x...', // GuardianAccountAbstractionWithRoles
  '0x...', // SimpleVault
  '0x...'  // SimpleRWA20
]

const analyses = await Promise.all(
  contracts.map(address => analyzer.analyzeContract(address))
)

analyses.forEach((analysis, index) => {
  console.log(`Contract ${index + 1}:`, {
    address: analysis.contractAddress,
    type: analysis.definitionType,
    compliance: analysis.complianceScore
  })
})
```

### **Workflow Comparison**

```typescript
const contract1Workflows = await analyzer.generateWorkflows('0x...')
const contract2Workflows = await analyzer.generateWorkflows('0x...')

// Compare workflow types
const typeComparison = {
  contract1: contract1Workflows.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + 1
    return acc
  }, {}),
  contract2: contract2Workflows.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + 1
    return acc
  }, {})
}

console.log('Workflow Type Comparison:', typeComparison)
```

### **Compliance Monitoring**

```typescript
// Monitor compliance over time
const complianceHistory = []

setInterval(async () => {
  const compliance = await analyzer.checkProtocolCompliance('0x...')
  complianceHistory.push({
    timestamp: Date.now(),
    score: compliance.score,
    violations: compliance.violations.length
  })
  
  // Alert if compliance drops
  if (compliance.score < 80) {
    console.warn('Compliance score dropped below 80%')
  }
}, 60000) // Check every minute
```

## 🔧 **Configuration**

### **Definition Library Addresses**

The analyzer uses deployed definition libraries. Update addresses as needed:

```typescript
// Default addresses (update for your network)
const definitionLibraries = {
  MultiPhaseSecureOperationDefinitions: '0x31A98eE1a373d748361800BD77a4613b7Fb04dFC',
  SecureOwnableDefinitions: '0xff40f080211F22c762669C42c5CAe0b563CB6373',
  DynamicRBACDefinitions: '0xe34718f0Ee4E56F80E564Bed8a7Eb4b2D06F2864'
}
```

### **Network Configuration**

```typescript
// Configure for different networks
const networkConfigs = {
  mainnet: {
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key'
  },
  goerli: {
    chainId: 5,
    rpcUrl: 'https://eth-goerli.alchemyapi.io/v2/your-api-key'
  },
  local: {
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545'
  }
}
```

## 📊 **Real-World Examples**

### **Analyze GuardianAccountAbstraction**

```typescript
const guardianAnalysis = await analyzer.analyzeContract(
  '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93'
)

console.log('GuardianAccountAbstraction Analysis:')
console.log('- Definition Type:', guardianAnalysis.definitionType) // 'SecureOwnable'
console.log('- Operation Types:', guardianAnalysis.operationTypes.map(op => op.name))
console.log('- Compliance Score:', guardianAnalysis.complianceScore)

// Generate workflows
const workflows = await analyzer.generateWorkflows(
  '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93'
)

workflows.forEach(workflow => {
  console.log(`- ${workflow.name}: ${workflow.type}`)
})
```

### **Analyze DynamicRBAC Contract**

```typescript
const rbacAnalysis = await analyzer.analyzeContract(
  '0xA5682DF1987D214Fe4dfC3a262179eBDc205b525'
)

console.log('DynamicRBAC Analysis:')
console.log('- Definition Type:', rbacAnalysis.definitionType) // 'DynamicRBAC'
console.log('- Role Permissions:', rbacAnalysis.rolePermissions.length)

// Check for role-specific workflows
const roleWorkflows = workflows.filter(w => 
  w.operations.some(op => op.type === 'ROLE_EDITING_TOGGLE')
)

console.log('Role-specific workflows:', roleWorkflows.length)
```

## 🧪 **Testing**

### **Unit Testing**

```typescript
import { describe, it, expect } from 'vitest'

describe('WorkflowAnalyzer', () => {
  it('should analyze contract correctly', async () => {
    const analysis = await analyzer.analyzeContract('0x...')
    
    expect(analysis.contractAddress).toBe('0x...')
    expect(analysis.definitionType).toBeDefined()
    expect(analysis.complianceScore).toBeGreaterThan(0)
  })

  it('should generate workflows', async () => {
    const workflows = await analyzer.generateWorkflows('0x...')
    
    expect(workflows.length).toBeGreaterThan(0)
    workflows.forEach(workflow => {
      expect(workflow.type).toBeDefined()
      expect(workflow.isValid).toBeDefined()
    })
  })
})
```

### **Integration Testing**

```typescript
describe('WorkflowAnalyzer Integration', () => {
  it('should analyze all deployed contracts', async () => {
    const contracts = [
      '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93', // GuardianAccountAbstraction
      '0xA5682DF1987D214Fe4dfC3a262179eBDc205b525'  // GuardianAccountAbstractionWithRoles
    ]

    for (const contract of contracts) {
      const analysis = await analyzer.analyzeContract(contract)
      expect(analysis.complianceScore).toBeGreaterThan(80)
    }
  })
})
```

## 🚨 **Common Issues**

### **Issue: "Definition library not found"**
**Solution**: Ensure definition libraries are deployed and addresses are correct.

### **Issue: "Contract not found"**
**Solution**: Verify the contract address and network configuration.

### **Issue: "Low compliance score"**
**Solution**: Check for protocol violations and implement recommendations.

### **Issue: "No workflows generated"**
**Solution**: Ensure the contract implements Guardian protocol interfaces.

## 📚 **Related Documentation**

- [Contract Analysis](./contract-analysis.md) - Detailed contract analysis
- [Workflow Generation](./workflow-generation.md) - Workflow generation and validation
- [Protocol Compliance](./protocol-compliance.md) - Compliance checking
- [API Reference](./api-reference.md) - Complete API documentation

---

**Ready to dive deeper?** Check out [Contract Analysis](./contract-analysis.md) for detailed analysis techniques.
