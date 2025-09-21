// SPDX-License-Identifier: MPL-2.0
import { PublicClient, Address } from 'viem'
import {
  ComplianceViolation,
  ComplianceResult
} from '../types/WorkflowTypes'

export interface InitializationStatus {
  isInitialized: boolean
  initializationMethod?: string
  initializerCalled?: boolean
  owner?: Address
  admin?: Address
  hasTimeLock?: boolean
  timeLockPeriod?: bigint
  hasRoles?: boolean
  roleCount?: number
  errors: string[]
  warnings: string[]
}

export interface InitializationValidationResult {
  isValid: boolean
  score: number
  status: InitializationStatus
  violations: ComplianceViolation[]
}

/**
 * @dev Validates contract initialization status
 * @notice Checks if Guardian contracts are properly initialized
 */
export class ContractInitializationValidator {
  private client: PublicClient

  constructor(client: PublicClient) {
    this.client = client
  }

  /**
   * @dev Validates contract initialization
   * @param contractAddress The contract address to validate
   * @param contractType The type of contract (SecureOwnable, DynamicRBAC, etc.)
   * @returns InitializationValidationResult with detailed status
   */
  async validateInitialization(
    contractAddress: Address,
    contractType: 'SecureOwnable' | 'DynamicRBAC' | 'MultiPhaseSecureOperation' | 'Generic'
  ): Promise<InitializationValidationResult> {
    const violations: ComplianceViolation[] = []
    const errors: string[] = []
    const warnings: string[] = []
    let score = 100

    try {
      const status = await this.checkInitializationStatus(contractAddress, contractType)
      
      // Check for critical errors in status check
      if (status.errors.length > 0) {
        violations.push({
          type: 'PROTOCOL_VIOLATION',
          severity: 'HIGH',
          description: `Blockchain connection failed`,
          recommendation: 'Check network connection and contract address'
        })
        score = 0
        errors.push(...status.errors)
      }
      
      // Check for critical initialization errors
      if (!status.isInitialized) {
        violations.push({
          type: 'PROTOCOL_VIOLATION',
          severity: 'HIGH',
          description: 'Contract is not properly initialized',
          recommendation: 'Initialize the contract before use'
        })
        score -= 50
        errors.push('Contract not initialized')
      }

      // Check for upgradeable contract initialization
      if (status.initializationMethod === 'initializer' && !status.initializerCalled) {
        violations.push({
          type: 'PROTOCOL_VIOLATION',
          severity: 'HIGH',
          description: 'Initializer not called',
          recommendation: 'Call the initializer function to properly initialize the contract'
        })
        score -= 40
        errors.push('Initializer not called')
      }

      // Check for missing critical components
      if (contractType === 'SecureOwnable' || contractType === 'DynamicRBAC') {
        if (!status.owner || status.owner === '0x0000000000000000000000000000000000000000') {
          violations.push({
            type: 'INVALID_ROLE',
            severity: 'HIGH',
            description: 'Contract has no owner set',
            recommendation: 'Set a valid owner address'
          })
          score -= 30
          errors.push('No owner set')
        }
      }

      // Check for DynamicRBAC specific issues
      if (contractType === 'DynamicRBAC') {
        if (!status.hasRoles || (status.roleCount && status.roleCount === 0)) {
          violations.push({
            type: 'INVALID_ROLE',
            severity: 'HIGH',
            description: 'DynamicRBAC contract has no roles defined',
            recommendation: 'Define at least one role for proper RBAC functionality'
          })
          score -= 20
          warnings.push('No roles defined in DynamicRBAC contract')
        }
      }

      // Check for MultiPhaseSecureOperation specific issues
      if (contractType === 'MultiPhaseSecureOperation') {
        if (!status.hasTimeLock || !status.timeLockPeriod || status.timeLockPeriod === BigInt(0)) {
          violations.push({
            type: 'PROTOCOL_VIOLATION',
            severity: 'HIGH',
            description: 'MultiPhaseSecureOperation contract has no time lock configured',
            recommendation: 'Set a valid time lock period for security operations'
          })
          score -= 25
          warnings.push('No time lock configured')
        }
      }

      // Check for upgradeable contract initialization
      if (status.initializationMethod === 'initializer') {
        // Check if initializer has been called
        const isInitialized = await this.checkInitializerCalled(contractAddress)
        if (!isInitialized) {
          violations.push({
            type: 'PROTOCOL_VIOLATION',
            severity: 'HIGH',
            description: 'Upgradeable contract initializer not called',
            recommendation: 'Call the initializer function to properly initialize the contract'
          })
          score -= 40
          errors.push('Initializer not called')
        }
      }

      return {
        isValid: violations.length === 0,
        score: Math.max(0, score),
        status: {
          ...status,
          errors,
          warnings
        },
        violations
      }

    } catch (error: any) {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: 'HIGH',
        description: `Initialization validation failed: ${error.message}`,
        recommendation: 'Check contract deployment and initialization'
      })

      return {
        isValid: false,
        score: 0,
        status: {
          isInitialized: false,
          errors: [`Validation error: ${error.message}`],
          warnings: []
        },
        violations
      }
    }
  }

  /**
   * @dev Checks the initialization status of a contract
   */
  private async checkInitializationStatus(
    contractAddress: Address,
    contractType: string
  ): Promise<InitializationStatus> {
    const status: InitializationStatus = {
      isInitialized: false,
      errors: [],
      warnings: []
    }

    try {
      // Check for owner (SecureOwnable, DynamicRBAC)
      if (contractType === 'SecureOwnable' || contractType === 'DynamicRBAC') {
        try {
          const owner = await this.client.readContract({
            address: contractAddress,
            abi: [{
              inputs: [],
              name: 'owner',
              outputs: [{ name: '', type: 'address' }],
              stateMutability: 'view',
              type: 'function'
            }],
            functionName: 'owner'
          }) as Address
          status.owner = owner
        } catch (error) {
          status.errors.push('Could not read owner')
        }
      }

      // Check for admin (some contracts use admin instead of owner)
      try {
        const admin = await this.client.readContract({
          address: contractAddress,
          abi: [{
            inputs: [],
            name: 'admin',
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'admin'
        }) as Address
        status.admin = admin
      } catch (error) {
        // Admin is optional, not an error
      }

      // Check for time lock (MultiPhaseSecureOperation)
      if (contractType === 'MultiPhaseSecureOperation') {
        try {
          const timeLockPeriod = await this.client.readContract({
            address: contractAddress,
            abi: [{
              inputs: [],
              name: 'timeLockPeriod',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function'
            }],
            functionName: 'timeLockPeriod'
          }) as bigint
          status.timeLockPeriod = timeLockPeriod
          status.hasTimeLock = timeLockPeriod > BigInt(0)
        } catch (error) {
          status.warnings.push('Could not read time lock period')
        }
      }

      // Check for roles (DynamicRBAC)
      if (contractType === 'DynamicRBAC') {
        try {
          const roleCount = await this.client.readContract({
            address: contractAddress,
            abi: [{
              inputs: [],
              name: 'getRoleCount',
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function'
            }],
            functionName: 'getRoleCount'
          }) as bigint
          status.roleCount = Number(roleCount)
          status.hasRoles = roleCount > BigInt(0)
        } catch (error) {
          status.warnings.push('Could not read role count')
        }
      }

      // Check for initialization method
      try {
        // Try to detect if this is an upgradeable contract
        const initialized = await this.client.readContract({
          address: contractAddress,
          abi: [{
            inputs: [],
            name: 'initialized',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'initialized'
        }) as boolean
        status.initializationMethod = 'initializer'
        status.initializerCalled = initialized
      } catch (error) {
        // Not an upgradeable contract, check for constructor-based initialization
        status.initializationMethod = 'constructor'
        status.initializerCalled = true // Constructor-based contracts are always "initialized"
      }

      // Determine if contract is initialized
      status.isInitialized = this.determineInitializationStatus(status, contractType)

    } catch (error: any) {
      status.errors.push(`Status check failed: ${error.message}`)
    }

    return status
  }

  /**
   * @dev Determines if a contract is properly initialized based on its status
   */
  private determineInitializationStatus(status: InitializationStatus, contractType: string): boolean {
    // Basic checks that apply to all contracts
    if (status.errors.length > 0) {
      return false
    }

    // Check if initializer was called (for upgradeable contracts)
    if (status.initializationMethod === 'initializer' && !status.initializerCalled) {
      return false
    }

    // Contract-specific initialization checks
    switch (contractType) {
      case 'SecureOwnable':
        return !!(status.owner && status.owner !== '0x0000000000000000000000000000000000000000')
      
      case 'DynamicRBAC':
        return !!(status.owner && status.owner !== '0x0000000000000000000000000000000000000000' && 
                 status.hasRoles && status.roleCount && status.roleCount > 0)
      
      case 'MultiPhaseSecureOperation':
        return !!(status.hasTimeLock && status.timeLockPeriod && status.timeLockPeriod > BigInt(0))
      
      case 'Generic':
        // For generic contracts, just check that we can read basic info
        return status.errors.length === 0
      
      default:
        return false
    }
  }

  /**
   * @dev Checks if an upgradeable contract's initializer has been called
   */
  private async checkInitializerCalled(contractAddress: Address): Promise<boolean> {
    try {
      const initialized = await this.client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: 'initialized',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'initialized'
      }) as boolean
      return initialized
    } catch (error) {
      // If we can't read the initialized flag, assume it's not initialized
      return false
    }
  }
}
