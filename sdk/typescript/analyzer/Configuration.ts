// SPDX-License-Identifier: MPL-2.0
import { Address } from 'viem'

/**
 * @title Network Configuration
 * @dev Configuration for different networks and their definition library addresses
 */
export interface NetworkConfig {
  id: number
  name: string
  rpcUrls: {
    default: { http: string[] }
    public: { http: string[] }
  }
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

/**
 * @title Definition Library Configuration
 * @dev Configuration for definition library addresses per network
 */
export interface DefinitionLibraryConfig {
  MultiPhaseSecureOperationDefinitions: Address
  SecureOwnableDefinitions: Address
  DynamicRBACDefinitions: Address
}

/**
 * @title Analyzer Configuration
 * @dev Complete configuration for the Guardian Workflow Analyzer
 */
export interface AnalyzerConfig {
  network: NetworkConfig
  definitionLibraries: DefinitionLibraryConfig
  contractAddresses?: {
    [contractName: string]: Address
  }
}

/**
 * @title Predefined Network Configurations
 * @dev Common network configurations for easy setup
 */
export const PREDEFINED_NETWORKS: Record<string, NetworkConfig> = {
  development: {
    id: parseInt(process.env.REMOTE_NETWORK_ID || '1337'),
    name: 'development',
    rpcUrls: {
      default: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] },
      public: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] }
    },
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  mainnet: {
    id: 1,
    name: 'mainnet',
    rpcUrls: {
      default: { http: ['https://eth.llamarpc.com'] },
      public: { http: ['https://eth.llamarpc.com'] }
    },
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  sepolia: {
    id: 11155111,
    name: 'sepolia',
    rpcUrls: {
      default: { http: ['https://rpc.sepolia.org'] },
      public: { http: ['https://rpc.sepolia.org'] }
    },
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  }
}

/**
 * @title Configuration Manager
 * @dev Manages configuration loading from environment variables and defaults
 */
export class ConfigurationManager {
  private config: AnalyzerConfig

  constructor(config?: Partial<AnalyzerConfig>) {
    this.config = this.loadConfiguration(config)
  }

  /**
   * @dev Loads configuration from environment variables and provided config
   */
  private loadConfiguration(providedConfig?: Partial<AnalyzerConfig>): AnalyzerConfig {
    const networkName = process.env.GUARDIAN_NETWORK || 'remote_ganache'
    const network = PREDEFINED_NETWORKS[networkName] || PREDEFINED_NETWORKS.remote_ganache

    // Load definition library addresses from environment variables
    const definitionLibraries: DefinitionLibraryConfig = {
      MultiPhaseSecureOperationDefinitions: (process.env.MULTIPHASE_DEFINITIONS_ADDRESS || 
        '0x0a38383369060f374601Ea29aAFB75300458e2D7') as Address,
      SecureOwnableDefinitions: (process.env.SECURE_OWNABLE_DEFINITIONS_ADDRESS || 
        '0x258ffE4fFcAfC08B0fEeB058eE855dc6adb5AF6A') as Address,
      DynamicRBACDefinitions: (process.env.DYNAMIC_RBAC_DEFINITIONS_ADDRESS || 
        '0x58C3D2b67f9F8c41855C5060A94a593885843674') as Address
    }

    // Load contract addresses from environment variables
    const contractAddresses: { [contractName: string]: Address } = {}
    if (process.env.GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS) {
      contractAddresses.GuardianAccountAbstraction = process.env.GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS as Address
    }
    if (process.env.GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS) {
      contractAddresses.GuardianAccountAbstractionWithRoles = process.env.GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS as Address
    }
    if (process.env.SIMPLE_VAULT_ADDRESS) {
      contractAddresses.SimpleVault = process.env.SIMPLE_VAULT_ADDRESS as Address
    }
    if (process.env.SIMPLE_RWA20_ADDRESS) {
      contractAddresses.SimpleRWA20 = process.env.SIMPLE_RWA20_ADDRESS as Address
    }

    return {
      network,
      definitionLibraries,
      contractAddresses: Object.keys(contractAddresses).length > 0 ? contractAddresses : undefined,
      ...providedConfig
    }
  }

  /**
   * @dev Gets the current configuration
   */
  getConfig(): AnalyzerConfig {
    return this.config
  }

  /**
   * @dev Gets the network configuration
   */
  getNetwork(): NetworkConfig {
    return this.config.network
  }

  /**
   * @dev Gets the definition library configuration
   */
  getDefinitionLibraries(): DefinitionLibraryConfig {
    return this.config.definitionLibraries
  }

  /**
   * @dev Gets a specific definition library address
   */
  getDefinitionLibraryAddress(libraryName: keyof DefinitionLibraryConfig): Address {
    return this.config.definitionLibraries[libraryName]
  }

  /**
   * @dev Gets contract addresses
   */
  getContractAddresses(): { [contractName: string]: Address } | undefined {
    return this.config.contractAddresses
  }

  /**
   * @dev Gets a specific contract address
   */
  getContractAddress(contractName: string): Address | undefined {
    return this.config.contractAddresses?.[contractName]
  }

  /**
   * @dev Updates the configuration
   */
  updateConfig(updates: Partial<AnalyzerConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * @dev Creates a configuration from environment variables
   */
  static fromEnvironment(): ConfigurationManager {
    return new ConfigurationManager()
  }

  /**
   * @dev Creates a configuration with custom values
   */
  static create(config: Partial<AnalyzerConfig>): ConfigurationManager {
    return new ConfigurationManager(config)
  }
}

/**
 * @title Default Configuration
 * @dev Default configuration for the Guardian Workflow Analyzer
 */
export const DEFAULT_CONFIG: AnalyzerConfig = {
  network: PREDEFINED_NETWORKS.remote_ganache,
  definitionLibraries: {
    MultiPhaseSecureOperationDefinitions: '0x0a38383369060f374601Ea29aAFB75300458e2D7' as Address,
    SecureOwnableDefinitions: '0x258ffE4fFcAfC08B0fEeB058eE855dc6adb5AF6A' as Address,
    DynamicRBACDefinitions: '0x58C3D2b67f9F8c41855C5060A94a593885843674' as Address
  }
}
