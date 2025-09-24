# Basic Examples

This guide provides practical examples of using the Guardian TypeScript SDK for common scenarios.

## 🚀 **Setup Examples**

### **Basic Client Setup**

```typescript
import { createPublicClient, createWalletClient, http } from 'viem'
import { mainnet, goerli } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Public client for read operations
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.alchemyapi.io/v2/your-api-key')
})

// Wallet client for write operations
const account = privateKeyToAccount('0x...') // Your private key
const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http('https://eth-mainnet.alchemyapi.io/v2/your-api-key')
})

// Testnet setup
const testnetClient = createPublicClient({
  chain: goerli,
  transport: http('https://eth-goerli.alchemyapi.io/v2/your-api-key')
})
```

### **Contract Instance Creation**

```typescript
import { SecureOwnable, DynamicRBAC } from '@guardian/sdk/typescript'

// SecureOwnable contract
const secureOwnable = new SecureOwnable(
  publicClient,
  walletClient,
  '0x...', // contract address
  mainnet
)

// DynamicRBAC contract
const dynamicRBAC = new DynamicRBAC(
  publicClient,
  walletClient,
  '0x...', // contract address
  mainnet
)

// Read-only instance (no wallet client)
const readOnlySecureOwnable = new SecureOwnable(
  publicClient,
  undefined, // no wallet client
  '0x...',
  mainnet
)
```

## 📖 **SecureOwnable Examples**

### **Reading Contract State**

```typescript
// Get contract owner
const owner = await secureOwnable.owner()
console.log('Contract owner:', owner)

// Get time lock period
const timeLockPeriod = await secureOwnable.getTimeLockPeriodSec()
console.log('Time lock period:', timeLockPeriod, 'seconds')

// Get administrative addresses
const broadcaster = await secureOwnable.broadcaster()
const recovery = await secureOwnable.recovery()
const eventForwarder = await secureOwnable.eventForwarder()

console.log('Broadcaster:', broadcaster)
console.log('Recovery:', recovery)
console.log('Event forwarder:', eventForwarder)

// Check initialization status
const isInitialized = await secureOwnable.isInitialized()
console.log('Contract initialized:', isInitialized)
```

### **Ownership Transfer Workflow**

```typescript
async function transferOwnership(newOwner: Address) {
  try {
    console.log('Starting ownership transfer workflow...')
    
    // Step 1: Request ownership transfer
    console.log('Step 1: Requesting ownership transfer...')
    const requestTx = await secureOwnable.transferOwnershipRequest(
      newOwner,
      { from: account.address }
    )
    console.log('Request transaction:', requestTx)
    
    // Step 2: Wait for transaction confirmation
    console.log('Step 2: Waiting for confirmation...')
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: requestTx 
    })
    console.log('Request confirmed:', receipt.status)
    
    // Step 3: Wait for time lock period
    console.log('Step 3: Waiting for time lock period...')
    const timeLockPeriod = await secureOwnable.getTimeLockPeriodSec()
    console.log(`Waiting ${timeLockPeriod} seconds...`)
    
    await new Promise(resolve => 
      setTimeout(resolve, Number(timeLockPeriod) * 1000)
    )
    
    // Step 4: Approve ownership transfer
    console.log('Step 4: Approving ownership transfer...')
    const approveTx = await secureOwnable.transferOwnershipDelayedApproval(
      1n, // transaction ID (get from events)
      { from: account.address }
    )
    console.log('Approval transaction:', approveTx)
    
    // Step 5: Verify new owner
    console.log('Step 5: Verifying new owner...')
    const newOwnerAddress = await secureOwnable.owner()
    console.log('New owner:', newOwnerAddress)
    
    if (newOwnerAddress.toLowerCase() === newOwner.toLowerCase()) {
      console.log('✅ Ownership transfer completed successfully!')
    } else {
      console.log('❌ Ownership transfer failed')
    }
    
  } catch (error) {
    console.error('Ownership transfer failed:', error.message)
  }
}

// Usage
await transferOwnership('0x...') // new owner address
```

### **Administrative Updates**

```typescript
// Update broadcaster (time-delay workflow)
async function updateBroadcaster(newBroadcaster: Address) {
  try {
    console.log('Updating broadcaster...')
    
    const txHash = await secureOwnable.updateBroadcasterRequest(
      newBroadcaster,
      { from: account.address }
    )
    
    console.log('Broadcaster update requested:', txHash)
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash 
    })
    
    if (receipt.status === 'success') {
      console.log('✅ Broadcaster update successful')
    } else {
      console.log('❌ Broadcaster update failed')
    }
    
  } catch (error) {
    console.error('Broadcaster update failed:', error.message)
  }
}

// Update recovery (immediate approval)
async function updateRecovery(newRecovery: Address) {
  try {
    console.log('Updating recovery address...')
    
    const txHash = await secureOwnable.updateRecoveryRequestAndApprove(
      newRecovery,
      { from: account.address }
    )
    
    console.log('Recovery update completed:', txHash)
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash 
    })
    
    if (receipt.status === 'success') {
      console.log('✅ Recovery update successful')
    } else {
      console.log('❌ Recovery update failed')
    }
    
  } catch (error) {
    console.error('Recovery update failed:', error.message)
  }
}

// Update time lock period (immediate approval)
async function updateTimeLock(newPeriod: bigint) {
  try {
    console.log('Updating time lock period...')
    
    const txHash = await secureOwnable.updateTimeLockRequestAndApprove(
      newPeriod,
      { from: account.address }
    )
    
    console.log('Time lock update completed:', txHash)
    
    // Verify update
    const updatedPeriod = await secureOwnable.getTimeLockPeriodSec()
    console.log('New time lock period:', updatedPeriod, 'seconds')
    
  } catch (error) {
    console.error('Time lock update failed:', error.message)
  }
}

// Usage
await updateBroadcaster('0x...') // new broadcaster
await updateRecovery('0x...')     // new recovery
await updateTimeLock(7200n)       // 2 hours
```

## 🔐 **DynamicRBAC Examples**

### **Role Management**

```typescript
// Check role editing status
async function checkRoleEditing() {
  const enabled = await dynamicRBAC.roleEditingEnabled()
  console.log('Role editing enabled:', enabled)
  return enabled
}

// Toggle role editing
async function toggleRoleEditing(enabled: boolean) {
  try {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} role editing...`)
    
    const txHash = await dynamicRBAC.updateRoleEditingToggleRequestAndApprove(
      enabled,
      { from: account.address }
    )
    
    console.log('Role editing toggle completed:', txHash)
    
    // Verify change
    const newStatus = await dynamicRBAC.roleEditingEnabled()
    console.log('New role editing status:', newStatus)
    
  } catch (error) {
    console.error('Role editing toggle failed:', error.message)
  }
}

// Get role information
async function getRoleInfo(roleHash: string) {
  try {
    const role = await dynamicRBAC.getRole(roleHash)
    console.log('Role information:', {
      name: role.name,
      hash: role.hash,
      maxWallets: role.maxWallets,
      isProtected: role.isProtected
    })
    return role
  } catch (error) {
    console.error('Failed to get role info:', error.message)
  }
}

// Check role membership
async function checkRoleMembership(account: Address, roleHash: string) {
  try {
    const hasRole = await dynamicRBAC.hasRole(account, roleHash)
    console.log(`Account ${account} has role ${roleHash}:`, hasRole)
    return hasRole
  } catch (error) {
    console.error('Failed to check role membership:', error.message)
  }
}

// Get role count
async function getRoleCount() {
  try {
    const count = await dynamicRBAC.getRoleCount()
    console.log('Total roles:', count)
    return count
  } catch (error) {
    console.error('Failed to get role count:', error.message)
  }
}

// Usage
await checkRoleEditing()
await toggleRoleEditing(true)
await getRoleInfo('0x...') // role hash
await checkRoleMembership('0x...', '0x...') // account, role hash
await getRoleCount()
```

## 🔍 **Workflow Analysis Examples**

### **Basic Contract Analysis**

```typescript
import { WorkflowAnalyzer } from '@guardian/sdk/typescript/analyzer'

// Create analyzer
const analyzer = new WorkflowAnalyzer(publicClient)

// Analyze a contract
async function analyzeContract(contractAddress: Address) {
  try {
    console.log(`Analyzing contract: ${contractAddress}`)
    
    const analysis = await analyzer.analyzeContract(contractAddress)
    
    console.log('Contract Analysis Results:')
    console.log('- Definition Type:', analysis.definitionType)
    console.log('- Operation Types:', analysis.operationTypes.length)
    console.log('- Function Schemas:', analysis.functionSchemas.length)
    console.log('- Role Permissions:', analysis.rolePermissions.length)
    console.log('- Compliance Score:', analysis.complianceScore)
    console.log('- Analysis Timestamp:', new Date(analysis.analysisTimestamp))
    
    return analysis
  } catch (error) {
    console.error('Contract analysis failed:', error.message)
  }
}

// Usage
const analysis = await analyzeContract('0x...')
```

### **Workflow Generation**

```typescript
// Generate workflows for a contract
async function generateWorkflows(contractAddress: Address) {
  try {
    console.log(`Generating workflows for: ${contractAddress}`)
    
    const workflows = await analyzer.generateWorkflows(contractAddress)
    
    console.log(`Generated ${workflows.length} workflows:`)
    
    workflows.forEach((workflow, index) => {
      console.log(`\nWorkflow ${index + 1}: ${workflow.name}`)
      console.log(`- Type: ${workflow.type}`)
      console.log(`- Valid: ${workflow.isValid}`)
      console.log(`- Operations: ${workflow.operations.length}`)
      console.log(`- State Transitions: ${workflow.stateTransitions.length}`)
      
      if (!workflow.isValid) {
        console.log(`- Validation Errors: ${workflow.validationErrors.join(', ')}`)
      }
      
      // Show operations
      workflow.operations.forEach((operation, opIndex) => {
        console.log(`  Operation ${opIndex + 1}: ${operation.name}`)
        console.log(`    - Type: ${operation.type}`)
        console.log(`    - Status: ${operation.status}`)
        console.log(`    - Required Actions: ${operation.requiredActions.join(', ')}`)
      })
    })
    
    return workflows
  } catch (error) {
    console.error('Workflow generation failed:', error.message)
  }
}

// Usage
const workflows = await generateWorkflows('0x...')
```

### **Workflow Validation**

```typescript
// Validate individual workflows
async function validateWorkflows(workflows: Workflow[]) {
  try {
    console.log('Validating workflows...')
    
    workflows.forEach((workflow, index) => {
      const validation = analyzer.validateWorkflow(workflow)
      
      console.log(`\nWorkflow ${index + 1}: ${workflow.name}`)
      console.log(`- Valid: ${validation.isValid}`)
      console.log(`- Score: ${validation.score}`)
      
      if (validation.errors.length > 0) {
        console.log(`- Errors: ${validation.errors.join(', ')}`)
      }
      
      if (validation.warnings.length > 0) {
        console.log(`- Warnings: ${validation.warnings.join(', ')}`)
      }
    })
    
  } catch (error) {
    console.error('Workflow validation failed:', error.message)
  }
}

// Usage
await validateWorkflows(workflows)
```

### **Protocol Compliance**

```typescript
// Check protocol compliance
async function checkCompliance(contractAddress: Address) {
  try {
    console.log(`Checking compliance for: ${contractAddress}`)
    
    const compliance = await analyzer.checkProtocolCompliance(contractAddress)
    
    console.log('Compliance Results:')
    console.log('- Compliant:', compliance.isCompliant ? '✅ Yes' : '❌ No')
    console.log('- Score:', compliance.score, '%')
    console.log('- Violations:', compliance.violations.length)
    console.log('- Recommendations:', compliance.recommendations.length)
    
    // Show violations
    if (compliance.violations.length > 0) {
      console.log('\nViolations:')
      compliance.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.severity}: ${violation.description}`)
        console.log(`   Recommendation: ${violation.recommendation}`)
      })
    }
    
    // Show recommendations
    if (compliance.recommendations.length > 0) {
      console.log('\nRecommendations:')
      compliance.recommendations.forEach((recommendation, index) => {
        console.log(`${index + 1}. ${recommendation}`)
      })
    }
    
    return compliance
  } catch (error) {
    console.error('Compliance check failed:', error.message)
  }
}

// Usage
const compliance = await checkCompliance('0x...')
```

### **Workflow Statistics**

```typescript
// Analyze workflow statistics
async function analyzeStatistics(workflows: Workflow[]) {
  try {
    console.log('Analyzing workflow statistics...')
    
    const stats = analyzer.analyzeWorkflowStatistics(workflows)
    
    console.log('Workflow Statistics:')
    console.log('- Total Workflows:', stats.totalWorkflows)
    console.log('- Valid Workflows:', stats.validWorkflows)
    console.log('- Broken Workflows:', stats.brokenWorkflows)
    console.log('- Total Operations:', stats.totalOperations)
    console.log('- Total State Transitions:', stats.totalStateTransitions)
    console.log('- Average Operations per Workflow:', stats.averageOperationsPerWorkflow.toFixed(2))
    console.log('- Average State Transitions per Workflow:', stats.averageStateTransitionsPerWorkflow.toFixed(2))
    
    console.log('\nWorkflow Types:')
    Object.entries(stats.workflowTypes).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`)
    })
    
    return stats
  } catch (error) {
    console.error('Statistics analysis failed:', error.message)
  }
}

// Usage
const stats = await analyzeStatistics(workflows)
```

## 📡 **Event Monitoring Examples**

### **SecureOwnable Events**

```typescript
// Monitor ownership transfer events
async function monitorOwnershipEvents(contractAddress: Address) {
  console.log('Monitoring ownership transfer events...')
  
  // Ownership transfer requested
  const unwatchRequest = publicClient.watchContractEvent({
    address: contractAddress,
    abi: secureOwnable.abi,
    eventName: 'OwnershipTransferRequested',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Ownership Transfer Requested:', {
          from: log.args.from,
          to: log.args.to,
          txId: log.args.txId,
          releaseTime: new Date(Number(log.args.releaseTime) * 1000)
        })
      })
    }
  })
  
  // Ownership transfer approved
  const unwatchApproval = publicClient.watchContractEvent({
    address: contractAddress,
    abi: secureOwnable.abi,
    eventName: 'OwnershipTransferApproved',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Ownership Transfer Approved:', {
          txId: log.args.txId,
          newOwner: log.args.newOwner
        })
      })
    }
  })
  
  // Return cleanup function
  return () => {
    unwatchRequest()
    unwatchApproval()
  }
}

// Monitor administrative events
async function monitorAdminEvents(contractAddress: Address) {
  console.log('Monitoring administrative events...')
  
  // Broadcaster updated
  const unwatchBroadcaster = publicClient.watchContractEvent({
    address: contractAddress,
    abi: secureOwnable.abi,
    eventName: 'BroadcasterUpdated',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Broadcaster Updated:', {
          oldBroadcaster: log.args.oldBroadcaster,
          newBroadcaster: log.args.newBroadcaster
        })
      })
    }
  })
  
  // Recovery updated
  const unwatchRecovery = publicClient.watchContractEvent({
    address: contractAddress,
    abi: secureOwnable.abi,
    eventName: 'RecoveryUpdated',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Recovery Updated:', {
          oldRecovery: log.args.oldRecovery,
          newRecovery: log.args.newRecovery
        })
      })
    }
  })
  
  // Time lock updated
  const unwatchTimeLock = publicClient.watchContractEvent({
    address: contractAddress,
    abi: secureOwnable.abi,
    eventName: 'TimeLockUpdated',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Time Lock Updated:', {
          oldPeriod: log.args.oldPeriod,
          newPeriod: log.args.newPeriod
        })
      })
    }
  })
  
  return () => {
    unwatchBroadcaster()
    unwatchRecovery()
    unwatchTimeLock()
  }
}

// Usage
const stopOwnershipMonitoring = await monitorOwnershipEvents('0x...')
const stopAdminMonitoring = await monitorAdminEvents('0x...')

// Stop monitoring after 5 minutes
setTimeout(() => {
  stopOwnershipMonitoring()
  stopAdminMonitoring()
  console.log('Event monitoring stopped')
}, 5 * 60 * 1000)
```

### **DynamicRBAC Events**

```typescript
// Monitor role events
async function monitorRoleEvents(contractAddress: Address) {
  console.log('Monitoring role events...')
  
  // Role created
  const unwatchRoleCreated = publicClient.watchContractEvent({
    address: contractAddress,
    abi: dynamicRBAC.abi,
    eventName: 'RoleCreated',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Role Created:', {
          roleHash: log.args.roleHash,
          roleName: log.args.roleName,
          maxWallets: log.args.maxWallets
        })
      })
    }
  })
  
  // Role granted
  const unwatchRoleGranted = publicClient.watchContractEvent({
    address: contractAddress,
    abi: dynamicRBAC.abi,
    eventName: 'RoleGranted',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Role Granted:', {
          roleHash: log.args.roleHash,
          account: log.args.account,
          granter: log.args.granter
        })
      })
    }
  })
  
  // Role revoked
  const unwatchRoleRevoked = publicClient.watchContractEvent({
    address: contractAddress,
    abi: dynamicRBAC.abi,
    eventName: 'RoleRevoked',
    onLogs: (logs) => {
      logs.forEach(log => {
        console.log('Role Revoked:', {
          roleHash: log.args.roleHash,
          account: log.args.account,
          revoker: log.args.revoker
        })
      })
    }
  })
  
  return () => {
    unwatchRoleCreated()
    unwatchRoleGranted()
    unwatchRoleRevoked()
  }
}

// Usage
const stopRoleMonitoring = await monitorRoleEvents('0x...')
```

## 🧪 **Complete Example: Contract Manager**

```typescript
class GuardianContractManager {
  private secureOwnable: SecureOwnable
  private dynamicRBAC: DynamicRBAC
  private analyzer: WorkflowAnalyzer

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient | undefined,
    secureOwnableAddress: Address,
    dynamicRBACAddress: Address,
    chain: Chain
  ) {
    this.secureOwnable = new SecureOwnable(
      publicClient,
      walletClient,
      secureOwnableAddress,
      chain
    )
    
    this.dynamicRBAC = new DynamicRBAC(
      publicClient,
      walletClient,
      dynamicRBACAddress,
      chain
    )
    
    this.analyzer = new WorkflowAnalyzer(publicClient)
  }

  // Get contract status
  async getStatus() {
    const [owner, timeLock, roleEditing] = await Promise.all([
      this.secureOwnable.owner(),
      this.secureOwnable.getTimeLockPeriodSec(),
      this.dynamicRBAC.roleEditingEnabled()
    ])

    return {
      owner,
      timeLockPeriod: timeLock,
      roleEditingEnabled: roleEditing
    }
  }

  // Analyze contracts
  async analyzeContracts() {
    const [secureOwnableAnalysis, dynamicRBACAnalysis] = await Promise.all([
      this.analyzer.analyzeContract(this.secureOwnable.contractAddress),
      this.analyzer.analyzeContract(this.dynamicRBAC.contractAddress)
    ])

    return {
      secureOwnable: secureOwnableAnalysis,
      dynamicRBAC: dynamicRBACAnalysis
    }
  }

  // Transfer ownership with analysis
  async transferOwnershipWithAnalysis(newOwner: Address) {
    console.log('Starting ownership transfer with analysis...')
    
    // Analyze current state
    const analysis = await this.analyzer.analyzeContract(
      this.secureOwnable.contractAddress
    )
    console.log('Pre-transfer compliance score:', analysis.complianceScore)
    
    // Perform transfer
    const txHash = await this.secureOwnable.transferOwnershipRequest(newOwner)
    console.log('Ownership transfer requested:', txHash)
    
    // Analyze post-transfer
    const postAnalysis = await this.analyzer.analyzeContract(
      this.secureOwnable.contractAddress
    )
    console.log('Post-transfer compliance score:', postAnalysis.complianceScore)
    
    return txHash
  }
}

// Usage
const manager = new GuardianContractManager(
  publicClient,
  walletClient,
  '0x...', // SecureOwnable address
  '0x...', // DynamicRBAC address
  mainnet
)

// Get status
const status = await manager.getStatus()
console.log('Contract Status:', status)

// Analyze contracts
const analyses = await manager.analyzeContracts()
console.log('Contract Analyses:', analyses)

// Transfer ownership
const txHash = await manager.transferOwnershipWithAnalysis('0x...')
console.log('Transfer completed:', txHash)
```

---

**Ready for advanced examples?** Check out [Advanced Examples](./examples-advanced.md) for complex scenarios and integrations.
