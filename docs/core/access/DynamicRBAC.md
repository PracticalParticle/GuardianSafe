# Solidity API

# DynamicRBAC

Minimal Dynamic Role-Based Access Control system based on StateAbstraction

This contract provides essential dynamic RBAC functionality:
- Creation of non-protected roles
- Basic wallet assignment to roles
- Function permission management per role
- Integration with StateAbstraction for secure operations

Key Features:
- Only non-protected roles can be created dynamically
- Protected roles (OWNER, BROADCASTER, RECOVERY) are managed by SecureOwnable
- Minimal interface for core RBAC operations
- Essential role management functions only




## Functions

### initialize

```solidity
function initialize(address initialOwner, address broadcaster, address recovery, uint256 timeLockPeriodSec, address eventForwarder) public nonpayable
```



**Parameters:**
- `` (): The initial owner address
- `` (): The broadcaster address
- `` (): The recovery address
- `` (): The timelock period in seconds
- `` (): The event forwarder address



---

### updateRoleEditingToggleExecutionOptions

```solidity
function updateRoleEditingToggleExecutionOptions(bool enabled) public pure returns (bytes)
```

Creates execution options for updating the role editing flag

**Parameters:**
- `` (): True to enable role editing, false to disable

**Returns:**
- The execution options


---

### updateRoleEditingToggleRequestAndApprove

```solidity
function updateRoleEditingToggleRequestAndApprove(struct StateAbstraction.MetaTransaction metaTx) public nonpayable returns (struct StateAbstraction.TxRecord)
```

Requests and approves a role editing toggle using a meta-transaction

**Parameters:**
- `` (): The meta-transaction

**Returns:**
- The transaction record


---

### createNewRole

```solidity
function createNewRole(string roleName, uint256 maxWallets, struct StateAbstraction.FunctionPermission[] functionPermissions) external nonpayable returns (bytes32)
```

Creates a new dynamic role with function permissions (always non-protected)

**Parameters:**
- `` (): The name of the role to create
- `` (): Maximum number of wallets allowed for this role
- `` (): Array of function permissions to grant to the role

**Returns:**
- The hash of the created role


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

### executeRoleEditingToggle

```solidity
function executeRoleEditingToggle(bool enabled) external nonpayable
```

External function that can only be called by the contract itself to execute role editing toggle

**Parameters:**
- `` (): True to enable role editing, false to disable



---

### _toggleRoleEditing

```solidity
function _toggleRoleEditing(bool enabled) internal nonpayable
```

Internal function to toggle role editing

**Parameters:**
- `` (): True to enable role editing, false to disable



---


## Events

### RoleCreated

```solidity
event RoleCreated(bytes32 roleHash, string roleName, uint256 maxWallets, bool isProtected)
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

### RoleEditingToggled

```solidity
event RoleEditingToggled(bool enabled)
```




---


## Structs


## Enums


