// SPDX-License-Identifier: MPL-2.0
import { PublicClient } from 'viem'
import { ContractInitializationValidator } from '../ContractInitializationValidator'
import { Address } from '../../types/WorkflowTypes'

describe('ContractInitializationValidator', () => {
  let validator: ContractInitializationValidator
  let mockClient: PublicClient

  // Mock addresses for testing
  const MOCK_SECURE_OWNABLE_CONTRACT = '0x1111111111111111111111111111111111111111' as Address
  const MOCK_DYNAMIC_RBAC_CONTRACT = '0x2222222222222222222222222222222222222222' as Address
  const MOCK_UNINITIALIZED_CONTRACT = '0x3333333333333333333333333333333333333333' as Address
  const MOCK_UPGRADEABLE_CONTRACT = '0x4444444444444444444444444444444444444444' as Address

  beforeEach(() => {
    mockClient = {
      readContract: jest.fn().mockImplementation(async ({ address, functionName }) => {
        // Mock SecureOwnable contract (properly initialized)
        if (address === MOCK_SECURE_OWNABLE_CONTRACT) {
          if (functionName === 'owner') {
            return '0x1234567890123456789012345678901234567890' as Address
          }
          if (functionName === 'initialized') {
            return true // Already initialized
          }
        }

        // Mock DynamicRBAC contract (properly initialized)
        if (address === MOCK_DYNAMIC_RBAC_CONTRACT) {
          if (functionName === 'owner') {
            return '0x1234567890123456789012345678901234567890' as Address
          }
          if (functionName === 'getRoleCount') {
            return BigInt(3) // Has 3 roles
          }
          if (functionName === 'initialized') {
            return true
          }
        }

        // Mock uninitialized contract
        if (address === MOCK_UNINITIALIZED_CONTRACT) {
          if (functionName === 'owner') {
            return '0x0000000000000000000000000000000000000000' as Address // Zero address
          }
          if (functionName === 'getRoleCount') {
            return BigInt(0) // No roles
          }
          if (functionName === 'initialized') {
            return false // Not initialized
          }
        }

        // Mock upgradeable contract with uninitialized state
        if (address === MOCK_UPGRADEABLE_CONTRACT) {
          if (functionName === 'owner') {
            return '0x1234567890123456789012345678901234567890' as Address
          }
          if (functionName === 'initialized') {
            return false // Initializer not called
          }
        }

        // Default: throw error for unknown functions
        throw new Error(`Function ${functionName} not found`)
      })
    } as unknown as PublicClient

    validator = new ContractInitializationValidator(mockClient)
  })

  describe('validateInitialization', () => {
    it('should validate a properly initialized SecureOwnable contract', async () => {
      const result = await validator.validateInitialization(MOCK_SECURE_OWNABLE_CONTRACT, 'SecureOwnable')
      
      expect(result.isValid).toBe(true)
      expect(result.score).toBe(100)
      expect(result.violations).toHaveLength(0)
      expect(result.status.isInitialized).toBe(true)
      expect(result.status.owner).toBe('0x1234567890123456789012345678901234567890')
      expect(result.status.initializationMethod).toBe('initializer')
    })

    it('should validate a properly initialized DynamicRBAC contract', async () => {
      const result = await validator.validateInitialization(MOCK_DYNAMIC_RBAC_CONTRACT, 'DynamicRBAC')
      
      expect(result.isValid).toBe(true)
      expect(result.score).toBe(100)
      expect(result.violations).toHaveLength(0)
      expect(result.status.isInitialized).toBe(true)
      expect(result.status.owner).toBe('0x1234567890123456789012345678901234567890')
      expect(result.status.hasRoles).toBe(true)
      expect(result.status.roleCount).toBe(3)
    })

    it('should detect uninitialized contract with zero owner', async () => {
      const result = await validator.validateInitialization(MOCK_UNINITIALIZED_CONTRACT, 'SecureOwnable')
      
      expect(result.isValid).toBe(false)
      expect(result.score).toBeLessThan(100)
      expect(result.violations.some(v => v.severity === 'HIGH')).toBe(true)
      expect(result.violations.some(v => v.description.includes('no owner set'))).toBe(true)
      expect(result.status.isInitialized).toBe(false)
      expect(result.status.errors).toContain('No owner set')
    })

    it('should detect DynamicRBAC contract with no roles', async () => {
      const result = await validator.validateInitialization(MOCK_UNINITIALIZED_CONTRACT, 'DynamicRBAC')
      
      expect(result.isValid).toBe(false)
      expect(result.score).toBeLessThan(100)
      expect(result.violations.some(v => v.severity === 'HIGH')).toBe(true)
      expect(result.violations.some(v => v.description.includes('no roles defined'))).toBe(true)
      expect(result.status.warnings).toContain('No roles defined in DynamicRBAC contract')
    })

    it('should detect upgradeable contract with uninitialized state', async () => {
      const result = await validator.validateInitialization(MOCK_UPGRADEABLE_CONTRACT, 'SecureOwnable')
      
      expect(result.isValid).toBe(false)
      expect(result.score).toBeLessThan(100)
      expect(result.violations.some(v => v.severity === 'HIGH')).toBe(true)
      expect(result.violations.some(v => v.description.includes('Initializer not called'))).toBe(true)
      expect(result.status.errors).toContain('Initializer not called')
    })

    it('should handle MultiPhaseSecureOperation contract validation', async () => {
      // Mock MultiPhaseSecureOperation contract with no time lock
      const originalMock = mockClient.readContract as jest.Mock
      originalMock.mockImplementation(async ({ address, functionName }) => {
        if (address === MOCK_UNINITIALIZED_CONTRACT && functionName === 'timeLockPeriod') {
          return BigInt(0) // No time lock
        }
        // Fallback to default mocks
        return jest.requireActual('viem').createPublicClient({}).readContract({ address, functionName })
      })

      const result = await validator.validateInitialization(MOCK_UNINITIALIZED_CONTRACT, 'MultiPhaseSecureOperation')
      
      expect(result.isValid).toBe(false)
      expect(result.score).toBeLessThan(100)
      expect(result.violations.some(v => v.severity === 'HIGH')).toBe(true)
      expect(result.violations.some(v => v.description.includes('no time lock configured'))).toBe(true)
      expect(result.status.warnings).toContain('No time lock configured')
    })

    it('should handle validation errors gracefully', async () => {
      const originalMock = mockClient.readContract as jest.Mock
      originalMock.mockImplementation(() => {
        throw new Error('Blockchain connection failed')
      })

      const result = await validator.validateInitialization(MOCK_SECURE_OWNABLE_CONTRACT, 'SecureOwnable')
      
      expect(result.isValid).toBe(false)
      expect(result.score).toBe(0)
      expect(result.violations.some(v => v.severity === 'HIGH')).toBe(true)
      expect(result.violations.some(v => v.description.includes('Blockchain connection failed'))).toBe(true)
      expect(result.status.errors.length).toBeGreaterThan(0)
    })
  })

  describe('initialization status detection', () => {
    it('should correctly determine initialization status for different contract types', async () => {
      // Test SecureOwnable
      const secureOwnableResult = await validator.validateInitialization(MOCK_SECURE_OWNABLE_CONTRACT, 'SecureOwnable')
      expect(secureOwnableResult.status.isInitialized).toBe(true)

      // Test DynamicRBAC
      const dynamicRBACResult = await validator.validateInitialization(MOCK_DYNAMIC_RBAC_CONTRACT, 'DynamicRBAC')
      expect(dynamicRBACResult.status.isInitialized).toBe(true)

      // Test uninitialized contract
      const uninitializedResult = await validator.validateInitialization(MOCK_UNINITIALIZED_CONTRACT, 'SecureOwnable')
      expect(uninitializedResult.status.isInitialized).toBe(false)
    })
  })

  describe('security features', () => {
    it('should detect critical security violations', async () => {
      const result = await validator.validateInitialization(MOCK_UNINITIALIZED_CONTRACT, 'SecureOwnable')
      
      expect(result.violations.some(v => v.severity === 'HIGH')).toBe(true)
      expect(result.violations.some(v => v.type === 'INVALID_ROLE')).toBe(true)
    })

    it('should provide actionable recommendations', async () => {
      const result = await validator.validateInitialization(MOCK_UNINITIALIZED_CONTRACT, 'SecureOwnable')
      
      const criticalViolations = result.violations.filter(v => v.severity === 'HIGH')
      expect(criticalViolations.length).toBeGreaterThan(0)
      
      criticalViolations.forEach(violation => {
        expect(violation.recommendation).toBeTruthy()
        expect(violation.recommendation.length).toBeGreaterThan(10)
      })
    })
  })
})
