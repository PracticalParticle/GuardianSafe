# Guardian Workflow Analyzer SDK

A dynamic, configurable SDK for analyzing Guardian smart contracts and their workflows.

## Features

- **Dynamic Configuration**: No hardcoded addresses - works with any network
- **Environment-Based Setup**: Configure via environment variables
- **Multiple Network Support**: Predefined configurations for common networks
- **Contract Type Detection**: Automatically detects Guardian contract types
- **Workflow Analysis**: Generates and validates workflows
- **Compliance Checking**: Protocol compliance validation
- **Integrity Validation**: Contract integrity verification

## Installation

```bash
npm install @particle/guardian-analyzer
```

## Quick Start

### 1. Environment Configuration

Create a `.env` file:

```bash
# Network Configuration
GUARDIAN_NETWORK=remote_ganache

# Definition Library Addresses
MULTIPHASE_DEFINITIONS_ADDRESS=0x0a38383369060f374601Ea29aAFB75300458e2D7
SECURE_OWNABLE_DEFINITIONS_ADDRESS=0x258ffE4fFcAfC08B0fEeB058eE855dc6adb5AF6A
DYNAMIC_RBAC_DEFINITIONS_ADDRESS=0x58C3D2b67f9F8c41855C5060A94a593885843674

# Contract Addresses (optional)
GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS=0xabd688943c065dEB475D7d1c5c829d18aEE185e7
GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS=0x0665417be6D5638AF01776593b4d2474Cb944aa9
```

### 2. Basic Usage

```typescript
import { createPublicClient, http } from 'viem'
import { WorkflowAnalyzer, ConfigurationManager } from '@particle/guardian-analyzer'

// Create client
const client = createPublicClient({
  chain: {
    id: 1337,
    name: 'remote_ganache',
    rpcUrls: {
      default: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] }
    }
  },
  transport: http()
})

// Create analyzer with configuration
const analyzer = new WorkflowAnalyzer(client, {
  network: {
    id: 1337,
    name: 'remote_ganache',
    rpcUrls: {
      default: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] }
    }
  },
  definitionLibraries: {
    MultiPhaseSecureOperationDefinitions: '0x0a38383369060f374601Ea29aAFB75300458e2D7',
    SecureOwnableDefinitions: '0x258ffE4fFcAfC08B0fEeB058eE855dc6adb5AF6A',
    DynamicRBACDefinitions: '0x58C3D2b67f9F8c41855C5060A94a593885843674'
  }
})

// Analyze a contract
const analysis = await analyzer.analyzeContract('0xabd688943c065dEB475D7d1c5c829d18aEE185e7')
console.log('Contract Type:', analysis.definitionType)
console.log('Operation Types:', analysis.operationTypes.length)
console.log('Compliance Score:', analysis.complianceScore)
```

### 3. Using Environment Configuration

```typescript
import { ConfigurationManager } from '@particle/guardian-analyzer'

// Load configuration from environment
const config = ConfigurationManager.fromEnvironment()
const analyzer = new WorkflowAnalyzer(client, config)

// Analyze contract
const analysis = await analyzer.analyzeContract(contractAddress)
```

## Configuration Options

### Network Configuration

```typescript
const networkConfig = {
  id: 1337,
  name: 'remote_ganache',
  rpcUrls: {
    default: { http: ['http://your-rpc-url:8545'] },
    public: { http: ['http://your-rpc-url:8545'] }
  },
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
}
```

### Definition Library Configuration

```typescript
const definitionLibraries = {
  MultiPhaseSecureOperationDefinitions: '0x...',
  SecureOwnableDefinitions: '0x...',
  DynamicRBACDefinitions: '0x...'
}
```

### Predefined Networks

The SDK includes predefined configurations for common networks:

- `localhost` - Local development
- `remote_ganache` - Remote Ganache instance
- `mainnet` - Ethereum mainnet
- `sepolia` - Sepolia testnet

```typescript
import { PREDEFINED_NETWORKS } from '@particle/guardian-analyzer'

const network = PREDEFINED_NETWORKS.mainnet
```

## API Reference

### WorkflowAnalyzer

Main analyzer class for contract analysis.

#### Constructor

```typescript
new WorkflowAnalyzer(client: PublicClient, config?: ConfigurationManager | AnalyzerConfig)
```

#### Methods

- `analyzeContract(address: Address): Promise<ContractAnalysis>`
- `generateWorkflows(address: Address): Promise<Workflow[]>`
- `checkProtocolCompliance(address: Address): Promise<ComplianceResult>`
- `analyzeWorkflowStatistics(workflows: Workflow[]): WorkflowStatistics`

### ConfigurationManager

Manages configuration loading and validation.

#### Methods

- `fromEnvironment(): ConfigurationManager` - Load from environment variables
- `create(config: AnalyzerConfig): ConfigurationManager` - Create with custom config
- `getConfig(): AnalyzerConfig` - Get current configuration
- `getDefinitionLibraryAddress(name: string): Address` - Get library address
- `getContractAddress(name: string): Address | undefined` - Get contract address

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GUARDIAN_NETWORK` | Network name (localhost, remote_ganache, mainnet, sepolia) | No |
| `MULTIPHASE_DEFINITIONS_ADDRESS` | MultiPhaseSecureOperationDefinitions address | Yes |
| `SECURE_OWNABLE_DEFINITIONS_ADDRESS` | SecureOwnableDefinitions address | Yes |
| `DYNAMIC_RBAC_DEFINITIONS_ADDRESS` | DynamicRBACDefinitions address | Yes |
| `GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS` | GuardianAccountAbstraction address | No |
| `GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS` | GuardianAccountAbstractionWithRoles address | No |
| `SIMPLE_VAULT_ADDRESS` | SimpleVault address | No |
| `SIMPLE_RWA20_ADDRESS` | SimpleRWA20 address | No |
| `CUSTOM_RPC_URL` | Custom RPC URL | No |
| `CUSTOM_NETWORK_ID` | Custom network ID | No |
| `CUSTOM_NETWORK_NAME` | Custom network name | No |

## Scripts

### Dynamic Analysis Script

```bash
# Using npm script
npm run analyze:dynamic

# Direct execution
node scripts/analyze-contract-dynamic.js
```

The script will:
1. Load configuration from environment variables
2. Validate required addresses are present
3. Analyze all configured contracts
4. Generate comprehensive reports

## Examples

### Custom Network Configuration

```typescript
const customConfig = {
  network: {
    id: 9999,
    name: 'custom_network',
    rpcUrls: {
      default: { http: ['http://custom-rpc:8545'] }
    },
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  definitionLibraries: {
    MultiPhaseSecureOperationDefinitions: '0x...',
    SecureOwnableDefinitions: '0x...',
    DynamicRBACDefinitions: '0x...'
  }
}

const analyzer = new WorkflowAnalyzer(client, customConfig)
```

### Runtime Contract Address

```typescript
// Analyze any contract address at runtime
const contractAddress = '0x1234567890123456789012345678901234567890'
const analysis = await analyzer.analyzeContract(contractAddress)
```

### Batch Analysis

```typescript
const contractAddresses = [
  '0xabd688943c065dEB475D7d1c5c829d18aEE185e7',
  '0x0665417be6D5638AF01776593b4d2474Cb944aa9',
  '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3'
]

const results = await Promise.all(
  contractAddresses.map(address => analyzer.analyzeContract(address))
)
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const analysis = await analyzer.analyzeContract(contractAddress)
} catch (error) {
  if (error.message.includes('Missing or invalid parameters')) {
    console.log('Contract not found or not a Guardian contract')
  } else if (error.message.includes('Network connection')) {
    console.log('Network connection failed')
  } else {
    console.log('Analysis failed:', error.message)
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MPL-2.0