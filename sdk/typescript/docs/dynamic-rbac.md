# DynamicRBAC Contract Integration

The `DynamicRBAC` class provides type-safe access to Guardian DynamicRBAC contracts with dynamic role-based access control and flexible permission management.

## 🎯 **Overview**

DynamicRBAC extends SecureOwnable with advanced role management:
- **Dynamic role creation** and management
- **Flexible permission system** with function-level access control
- **Role hierarchy** and inheritance
- **Meta-transaction support** for role operations
- **Event-driven role updates** for external monitoring

## 🚀 **Quick Start**

```typescript
import { DynamicRBAC } from '@guardian/sdk/typescript'
import { createPublicClient, createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// Initialize clients
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

const walletClient = createWalletClient({
  account: privateKeyToAccount('0x...'),
  chain: mainnet,
  transport: http()
})

// Create DynamicRBAC instance
const dynamicRBAC = new DynamicRBAC(
  publicClient,
  walletClient,
  '0x...', // contract address
  mainnet
)
```

## 📖 **Core Features**

### **1. Role Management**

#### **Check Role Editing Status**
```typescript
const roleEditingEnabled = await dynamicRBAC.roleEditingEnabled()
console.log('Role editing enabled:', roleEditingEnabled)
```

#### **Toggle Role Editing**
```typescript
// Enable/disable role editing (meta-transaction)
const txHash = await dynamicRBAC.updateRoleEditingToggleRequestAndApprove(
  true, // enable role editing
  { from: account.address }
)

console.log('Role editing toggled:', txHash)
```

#### **Get Role Information**
```typescript
const role = await dynamicRBAC.getRole('0x...') // role hash
console.log('Role info:', {
  name: role.name,
  hash: role.hash,
  maxWallets: role.maxWallets,
  isProtected: role.isProtected
})
```

#### **Check Account Role**
```typescript
const hasRole = await dynamicRBAC.hasRole(
  '0x...', // account address
  '0x...'  // role hash
)
console.log('Account has role:', hasRole)
```

#### **Get Role Count**
```typescript
const roleCount = await dynamicRBAC.getRoleCount()
console.log('Total roles:', roleCount)
```

### **2. Permission Management**

#### **Check Function Permissions**
```typescript
// Check if role has permission for specific function
const hasPermission = await dynamicRBAC.hasFunctionPermission(
  '0x...', // account address
  '0x...'  // function selector
)
console.log('Has function permission:', hasPermission)
```

#### **Get Role Permissions**
```typescript
const permissions = await dynamicRBAC.getRolePermissions('0x...') // role hash
console.log('Role permissions:', permissions)
```

### **3. Advanced Role Operations**

#### **Create Role**
```typescript
// Create a new role (if role editing is enabled)
const txHash = await dynamicRBAC.createRole(
  'ADMIN_ROLE', // role name
  10, // max wallets
  { from: account.address }
)
```

#### **Grant Role**
```typescript
// Grant role to account
const txHash = await dynamicRBAC.grantRole(
  '0x...', // role hash
  '0x...', // account address
  { from: account.address }
)
```

#### **Revoke Role**
```typescript
// Revoke role from account
const txHash = await dynamicRBAC.revokeRole(
  '0x...', // role hash
  '0x...', // account address
  { from: account.address }
)
```

## 🔄 **Workflow Patterns**

### **Role Creation Workflow**

```typescript
// Step 1: Enable role editing
await dynamicRBAC.updateRoleEditingToggleRequestAndApprove(true)

// Step 2: Create role
const createTx = await dynamicRBAC.createRole('MODERATOR_ROLE', 5)

// Step 3: Grant role to accounts
const grantTx = await dynamicRBAC.grantRole(roleHash, moderatorAddress)
```

### **Permission Management Workflow**

```typescript
// Step 1: Check current permissions
const currentPermissions = await dynamicRBAC.getRolePermissions(roleHash)

// Step 2: Update permissions (if supported)
const updateTx = await dynamicRBAC.updateRolePermissions(
  roleHash,
  newPermissions
)

// Step 3: Verify permissions
const updatedPermissions = await dynamicRBAC.getRolePermissions(roleHash)
```

### **Role Hierarchy Workflow**

```typescript
// Step 1: Create parent role
const parentRoleTx = await dynamicRBAC.createRole('ADMIN_ROLE', 3)

// Step 2: Create child role
const childRoleTx = await dynamicRBAC.createRole('MODERATOR_ROLE', 10)

// Step 3: Set hierarchy (if supported)
const hierarchyTx = await dynamicRBAC.setRoleHierarchy(
  childRoleHash,
  parentRoleHash
)
```

## 📡 **Event Monitoring**

### **Listen for Role Events**

```typescript
// Role created
const unwatchRoleCreated = publicClient.watchContractEvent({
  address: contractAddress,
  abi: dynamicRBAC.abi,
  eventName: 'RoleCreated',
  onLogs: (logs) => {
    logs.forEach(log => {
      console.log('Role created:', {
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
      console.log('Role granted:', {
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
      console.log('Role revoked:', {
        roleHash: log.args.roleHash,
        account: log.args.account,
        revoker: log.args.revoker
      })
    })
  }
})

// Stop watching
unwatchRoleCreated()
unwatchRoleGranted()
unwatchRoleRevoked()
```

### **Listen for Permission Events**

```typescript
// Permission updated
const unwatchPermissionUpdated = publicClient.watchContractEvent({
  address: contractAddress,
  abi: dynamicRBAC.abi,
  eventName: 'PermissionUpdated',
  onLogs: (logs) => {
    logs.forEach(log => {
      console.log('Permission updated:', {
        roleHash: log.args.roleHash,
        functionSelector: log.args.functionSelector,
        grantedActions: log.args.grantedActions
      })
    })
  }
})
```

## 🛡️ **Security Features**

### **1. Role Protection**

Some roles are protected and cannot be modified:

```typescript
const role = await dynamicRBAC.getRole(roleHash)
if (role.isProtected) {
  console.log('This role is protected and cannot be modified')
}
```

### **2. Wallet Limits**

Roles have maximum wallet limits:

```typescript
const role = await dynamicRBAC.getRole(roleHash)
const currentWallets = await dynamicRBAC.getRoleWalletCount(roleHash)

if (currentWallets >= role.maxWallets) {
  throw new Error('Role has reached maximum wallet limit')
}
```

### **3. Function-Level Permissions**

Fine-grained permission control:

```typescript
// Check specific function permission
const canTransfer = await dynamicRBAC.hasFunctionPermission(
  account,
  '0xa9059cbb' // transfer function selector
)

if (!canTransfer) {
  throw new Error('Account does not have transfer permission')
}
```

## 🔧 **Advanced Usage**

### **Role-Based Access Control**

```typescript
class RoleBasedContract {
  constructor(private dynamicRBAC: DynamicRBAC) {}

  async executeWithRoleCheck(
    account: Address,
    functionSelector: string,
    operation: () => Promise<Hash>
  ): Promise<Hash> {
    // Check role permission
    const hasPermission = await this.dynamicRBAC.hasFunctionPermission(
      account,
      functionSelector
    )

    if (!hasPermission) {
      throw new Error('Insufficient permissions')
    }

    // Execute operation
    return await operation()
  }
}
```

### **Batch Role Operations**

```typescript
// Grant multiple roles to multiple accounts
const roleGrants = [
  { roleHash: '0x...', account: '0x...' },
  { roleHash: '0x...', account: '0x...' },
  { roleHash: '0x...', account: '0x...' }
]

const results = await Promise.allSettled(
  roleGrants.map(grant => 
    dynamicRBAC.grantRole(grant.roleHash, grant.account)
  )
)

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`Role grant ${index} successful:`, result.value)
  } else {
    console.error(`Role grant ${index} failed:`, result.reason)
  }
})
```

### **Role Hierarchy Management**

```typescript
// Check role hierarchy
const isChildOf = await dynamicRBAC.isChildRole(childRoleHash, parentRoleHash)

// Get all child roles
const childRoles = await dynamicRBAC.getChildRoles(parentRoleHash)

// Get all parent roles
const parentRoles = await dynamicRBAC.getParentRoles(childRoleHash)
```

## 📊 **Workflow Analysis**


### **Role Permission Analysis**

```typescript
// Analyze role permissions
const rolePermissions = analysis.rolePermissions

rolePermissions.forEach(permission => {
  console.log('Role Permission:', {
    roleHash: permission.roleHash,
    functionSelector: permission.functionSelector,
    grantedActions: permission.grantedActions
  })
})
```

## 🧪 **Testing**

### **Unit Testing**

```typescript
import { describe, it, expect } from 'vitest'

describe('DynamicRBAC', () => {
  it('should return correct role editing status', async () => {
    const enabled = await dynamicRBAC.roleEditingEnabled()
    expect(typeof enabled).toBe('boolean')
  })

  it('should check role membership', async () => {
    const hasRole = await dynamicRBAC.hasRole(account, roleHash)
    expect(typeof hasRole).toBe('boolean')
  })

  it('should toggle role editing', async () => {
    const txHash = await dynamicRBAC.updateRoleEditingToggleRequestAndApprove(true)
    expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/)
  })
})
```

### **Integration Testing**

```typescript
describe('DynamicRBAC Integration', () => {
  it('should complete role creation workflow', async () => {
    // Enable role editing
    await dynamicRBAC.updateRoleEditingToggleRequestAndApprove(true)
    
    // Create role
    const createTx = await dynamicRBAC.createRole('TEST_ROLE', 5)
    
    // Grant role
    const grantTx = await dynamicRBAC.grantRole(roleHash, testAccount)
    
    // Verify role
    const hasRole = await dynamicRBAC.hasRole(testAccount, roleHash)
    expect(hasRole).toBe(true)
  })
})
```

## 🚨 **Common Issues**

### **Issue: "Role editing is disabled"**
**Solution**: Enable role editing before creating or modifying roles.

### **Issue: "Role has reached maximum wallet limit"**
**Solution**: Increase the role's wallet limit or revoke roles from other accounts.

### **Issue: "Role is protected"**
**Solution**: Protected roles cannot be modified. Use a different role or create a new one.

### **Issue: "Insufficient permissions"**
**Solution**: Ensure the account has the required role and function permissions.

### **Issue: "Invalid role hash"**
**Solution**: Use the correct role hash. Generate it using `keccak256(abi.encodePacked(roleName))`.

## 📚 **Related Documentation**

- [API Reference](./api-reference.md) - Complete API documentation
- [SecureOwnable Guide](./secure-ownable.md) - Base contract functionality
- [Best Practices](./best-practices.md) - Development guidelines

---

