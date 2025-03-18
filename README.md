> ⚠️ **WARNING: EXPERIMENTAL SOFTWARE** ⚠️
> 
> This repository contains experimental, untested smart contract code. It is not ready for production use and may contain security vulnerabilities. Use at your own risk. Do not use with real assets or in production environments.

# Particle Guardian Account Abstraction Contracts

A secure smart contract framework implementing advanced account abstraction with multi-phase security operations, powered by Particle Crypto Security's innovative approach.

## Overview

Particle's Guardian Account Abstraction provides a sophisticated security framework that decouples user assets from user authority while maintaining the benefits of decentralization. This implementation replaces the single-key vulnerability model with a multi-phase security architecture that distributes authority across specialized roles and introduces time-based security gates for critical operations.

The implementation centers around three core components:

- **SecureOwnable**: A base contract providing secure ownership management with timelock and recovery features
- **MultiPhaseSecureOperation**: A library implementing core security logic for multi-phase operations
- **GuardianAccountAbstraction**: The main implementation contract that extends SecureOwnable

## Key Features

### 1. Multi-Phase Security Model
- Two-Phase Workflow for critical operations
  - Request and approval as separate transactions
  - Enforced time delay between phases
  - Maximum security through time-delayed verification
  - Enables proactive security intervention
- Single-Phase Meta-Transaction support
  - Combines request and approval into one transaction
  - Optimizes gas efficiency and user experience
  - Maintains security through cryptographic signature verification

### 2. Core Security Components
- Asset-Authority Decoupling: Smart contracts hold funds while user wallets retain signing authority
- Time-Locked Security Operations: Mandatory waiting periods for critical actions
- Role-Based Access Control: Distinct owner, broadcaster, and recovery roles with specific permissions
- Meta-Transaction Support: delegated transactions with full security guarantees
- Recovery Mechanisms: Dedicated recovery features with secure role-based processes
- Flexible Approval Methods: Multiple workflows balancing security and convenience

### 3. Operation Types
- Ownership Updates: Secure transfer of contract ownership with timelock and recovery options
- Broadcaster Updates: Changing the meta-transaction broadcaster with proper permissions
- Recovery Updates: Modifying recovery parameters with owner verification
- Timelock Updates: Adjusting security timeframes with appropriate authorization
- Custom Updates: Extendable framework for application-specific operations

## Getting Started

### Prerequisites
1. Install Ganache for local blockchain development
```bash
# Visit https://trufflesuite.com/ganache/ and download the appropriate version
```

2. Install Truffle globally for smart contract compilation and deployment
```bash
npm install -g truffle
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/PracticalParticle/particle-core.git
```

2. Install dependencies
```bash
npm install
```

3. Run Ganache with appropriate settings
```bash
ganache --deterministic --networkId 1337
```

4. Compile and deploy contracts
```bash
truffle compile
truffle migrate --network development
```

## Architecture

### 1. Smart Contract Components

#### SecureOwnable Contract
- Base implementation for account abstraction with enhanced security features
- Time-locked ownership management with multi-phase transfers
- Role-based access control with owner, broadcaster, and recovery roles
- Meta-transaction support for delegated operations
- Comprehensive event emission for monitoring and auditing

#### MultiPhaseSecureOperation Library
- Core security logic for multi-phase operations
- Transaction state management with strict lifecycle enforcement
- Sophisticated time delay enforcement with release time calculations
- Cryptographic signature verification for meta-transactions
- Extensive type safety with well-defined data structures

#### GuardianAccountAbstraction Contract
- Main implementation contract extending SecureOwnable
- Ready-to-use account abstraction solution
- Customizable for specific application needs
- Full implementation of all security features

### 2. TypeScript SDK

The project includes a comprehensive TypeScript SDK that provides:
- Type-safe contract interfaces aligned with Viem
- Full contract interaction capabilities with proper typing
- Meta-transaction generation and signing utilities
- Event monitoring with typed event parsing
- Comprehensive operation management with lifecycle tracking

## Security Model

### 1. Role Management
- Owner: Primary control of the contract, can approve operations after timelock, cannot bypass security measures
- Broadcaster: Handles meta-transactions, enables delegated operations, verifies signatures before execution
- Recovery: Backup access for emergencies, can initiate ownership transfers, subject to same timelock constraints

### 2. Time-Lock Security
- Mandatory waiting periods configurable in minutes
- Cancellation windows with specific timing rules
- Release time calculations based on contract configuration
- Security monitoring period between request and execution

### 3. Transaction Security
- Multi-phase execution model with strict state transitions
- EIP-712 compliant signature verification
- Comprehensive transaction record keeping
- Detailed event emission for external monitoring

## Usage Examples

### Basic Operations

```typescript
// Initialize the contract
const secureOwnable = new SecureOwnable(
  publicClient,
  walletClient,
  contractAddress,
  chain
);

// Request ownership transfer (only callable by recovery address)
await secureOwnable.transferOwnershipRequest({
  from: recoveryAddress
});

// Approve delayed ownership transfer (after timelock period)
await secureOwnable.transferOwnershipDelayedApproval(
  txId,
  { from: ownerAddress }
);

// Request broadcaster update (only callable by owner)
await secureOwnable.updateBroadcasterRequest(
  newBroadcasterAddress,
  { from: ownerAddress }
);
```

### Meta-Transactions

```typescript
// Generate meta-transaction parameters
const metaTxParams = await secureOwnable.createMetaTxParams(
  contractAddress,
  '0x12345678', // function selector
  BigInt(24), // deadline in hours
  BigInt('50000000000'), // max gas price
  signer
);

// Generate unsigned meta-transaction
const metaTx = await secureOwnable.generateUnsignedMetaTransactionForExisting(
  txId,
  metaTxParams
);

// Sign the meta-transaction (client-side)
const signature = await walletClient.signMessage({
  message: { raw: metaTx.message as Uint8Array },
  account: signer
});

// Execute with meta-transaction
await secureOwnable.transferOwnershipApprovalWithMetaTx(
  {
    ...metaTx,
    signature
  },
  { from: broadcasterAddress }
);
```

## Benefits and Use Cases

### Enhanced Security
- Multiple security layers through phase separation and role separation
- Time-delayed operations for critical actions with intervention opportunities
- Cryptographic verification for all operations
- Defense-in-depth approach to securing digital assets

### Improved User Experience
- delegated transactions through meta-transaction support
- Transaction status monitoring and comprehensive history
- Flexible workflows balancing security and convenience
- Robust recovery options for account access

### Common Use Cases
1. **Smart Contract Wallets**: Secure multi-party asset management with recovery options
2. **DApp Integration**: Enhanced security layer for critical operations with delegated transactions
3. **Enterprise Solutions**: Multi-party approval workflows with comprehensive audit trails
4. **Custody Solutions**: Institutional-grade security with proper access controls

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MPL-2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Particle Crypto Security for the innovative account abstraction implementation
- OpenZeppelin for secure smart contract components
- Viem for TypeScript blockchain interactions

---

Created by Particle Crypto Security  
Copyright © 2025 Particle Crypto Security. All rights reserved.

