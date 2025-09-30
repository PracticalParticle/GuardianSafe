# Solidity API

# IDynamicRBAC

Interface for Dynamic Role-Based Access Control system

This interface defines the standard functions for managing dynamic roles
in a secure multi-phase operation environment. It provides:

- Dynamic role creation and management
- Role-based permission assignment
- Wallet assignment to roles
- Role hierarchy and inheritance
- Integration with StateAbstraction for secure operations

The interface supports both protected and non-protected roles,
allowing for flexible access control management.




## Functions

### createRole

```solidity
function createRole(string roleName, uint256 maxWallets) external nonpayable returns (bytes32)
```

Creates a new dynamic role (always non-protected)

**Parameters:**
- `` (): The name of the role to create
- `` (): Maximum number of wallets allowed for this role

**Returns:**
- The hash of the created role


---

### updateRole

```solidity
function updateRole(bytes32 roleHash, string newRoleName, uint256 newMaxWallets) external nonpayable
```

Updates an existing role's properties

**Parameters:**
- `` (): The hash of the role to update
- `` (): The new name for the role
- `` (): The new maximum number of wallets



---

### deleteRole

```solidity
function deleteRole(bytes32 roleHash) external nonpayable
```

Deletes a non-protected role

**Parameters:**
- `` (): The hash of the role to delete



---

### addWalletToRole

```solidity
function addWalletToRole(bytes32 roleHash, address wallet) external nonpayable
```

Adds a wallet to a role

**Parameters:**
- `` (): The hash of the role
- `` (): The wallet address to add



---

### revokeWallet

```solidity
function revokeWallet(bytes32 roleHash, address wallet) external nonpayable
```

Removes a wallet from a role

**Parameters:**
- `` (): The hash of the role
- `` (): The wallet address to remove



---

### replaceWalletInRole

```solidity
function replaceWalletInRole(bytes32 roleHash, address newWallet, address oldWallet) external nonpayable
```

Replaces a wallet in a role with a new wallet

**Parameters:**
- `` (): The hash of the role
- `` (): The new wallet address
- `` (): The old wallet address to replace



---

### addFunctionPermissionToRole

```solidity
function addFunctionPermissionToRole(bytes32 roleHash, bytes4 functionSelector, enum StateAbstraction.TxAction action) external nonpayable
```

Adds a function permission to a role

**Parameters:**
- `` (): The hash of the role
- `` (): The function selector to grant permission for
- `` (): The action type to grant



---

### removeFunctionPermissionFromRole

```solidity
function removeFunctionPermissionFromRole(bytes32 roleHash, bytes4 functionSelector) external nonpayable
```

Removes a function permission from a role

**Parameters:**
- `` (): The hash of the role
- `` (): The function selector to remove permission for



---

### getDynamicRoles

```solidity
function getDynamicRoles() external view returns (bytes32[])
```

Gets all dynamic roles (non-protected roles)


**Returns:**
- Array of role hashes


---

### getAllRoles

```solidity
function getAllRoles() external view returns (bytes32[])
```

Gets all roles (including protected roles)


**Returns:**
- Array of role hashes


---

### getRoleInfo

```solidity
function getRoleInfo(bytes32 roleHash) external view returns (string, uint256, bool, address[])
```

Gets role information

**Parameters:**
- `` (): The hash of the role

**Returns:**
- The name of the role
- The maximum number of wallets allowed
- Whether the role is protected
- Array of authorized wallet addresses


---

### hasRole

```solidity
function hasRole(bytes32 roleHash, address wallet) external view returns (bool)
```

Checks if a wallet has a specific role

**Parameters:**
- `` (): The hash of the role
- `` (): The wallet address to check

**Returns:**
- True if the wallet has the role, false otherwise


---

### getWalletsInRole

```solidity
function getWalletsInRole(bytes32 roleHash) external view returns (address[])
```

Gets all wallets in a role

**Parameters:**
- `` (): The hash of the role

**Returns:**
- Array of wallet addresses


---

### getRolePermissions

```solidity
function getRolePermissions(bytes32 roleHash) external view returns (bytes4[], enum StateAbstraction.TxAction[])
```

Gets all function permissions for a role

**Parameters:**
- `` (): The hash of the role

**Returns:**
- Array of function selectors
- Array of granted actions


---

### roleExists

```solidity
function roleExists(bytes32 roleHash) external view returns (bool)
```

Checks if a role exists

**Parameters:**
- `` (): The hash of the role

**Returns:**
- True if the role exists, false otherwise


---

### isRoleProtected

```solidity
function isRoleProtected(bytes32 roleHash) external view returns (bool)
```

Checks if a role is protected

**Parameters:**
- `` (): The hash of the role

**Returns:**
- True if the role is protected, false otherwise


---

### getRoleWalletCount

```solidity
function getRoleWalletCount(bytes32 roleHash) external view returns (uint256)
```

Gets the number of wallets in a role

**Parameters:**
- `` (): The hash of the role

**Returns:**
- The number of wallets currently assigned to the role


---

### isRoleAtCapacity

```solidity
function isRoleAtCapacity(bytes32 roleHash) external view returns (bool)
```

Checks if a role has reached its maximum wallet limit

**Parameters:**
- `` (): The hash of the role

**Returns:**
- True if the role is at capacity, false otherwise


---


## Events

### RoleCreated

```solidity
event RoleCreated(bytes32 roleHash, string roleName, uint256 maxWallets, bool isProtected)
```




---

### RoleUpdated

```solidity
event RoleUpdated(bytes32 roleHash, string newRoleName, uint256 newMaxWallets)
```




---

### WalletAddedToRole

```solidity
event WalletAddedToRole(bytes32 roleHash, address wallet)
```




---

### WalletRemovedFromRole

```solidity
event WalletRemovedFromRole(bytes32 roleHash, address wallet)
```




---

### RoleDeleted

```solidity
event RoleDeleted(bytes32 roleHash)
```




---

### FunctionPermissionAdded

```solidity
event FunctionPermissionAdded(bytes32 roleHash, bytes4 functionSelector, enum StateAbstraction.TxAction action)
```




---

### FunctionPermissionRemoved

```solidity
event FunctionPermissionRemoved(bytes32 roleHash, bytes4 functionSelector)
```




---


## Structs


## Enums


