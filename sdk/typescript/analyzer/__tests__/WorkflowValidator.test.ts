// SPDX-License-Identifier: MPL-2.0
import { WorkflowValidator } from '../WorkflowValidator'
import { 
  Workflow, 
  WorkflowType, 
  DefinitionType, 
  OperationType, 
  TxAction, 
  TxStatus,
  ValidationResult
} from '../../types/WorkflowTypes'

describe('WorkflowValidator', () => {
  let validator: WorkflowValidator

  beforeEach(() => {
    validator = new WorkflowValidator()
  })

  describe('validateWorkflow', () => {
    it('should validate a valid SecureOwnable workflow', () => {
      const workflow: Workflow = {
        id: 'ownership-transfer',
        name: 'Ownership Transfer',
        type: 'HYBRID',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'ownership-transfer-op',
          type: 'OWNERSHIP_TRANSFER',
          functions: [{
            name: 'transferOwnershipRequest',
            selector: '0x12345678',
            operationType: 'OWNERSHIP_TRANSFER',
            supportedActions: ['EXECUTE_TIME_DELAY_REQUEST'],
            parameters: []
          }],
          roles: [{
            roleHash: '0xOWNER_ROLE',
            roleName: 'OWNER_ROLE',
            functionSelector: '0x12345678',
            grantedActions: ['EXECUTE_TIME_DELAY_REQUEST']
          }],
          requiredActions: ['EXECUTE_TIME_DELAY_REQUEST', 'EXECUTE_TIME_DELAY_APPROVE'],
          stateTransitions: []
        }],
        stateTransitions: [
          {
            from: 'UNDEFINED',
            to: 'PENDING',
            conditions: ['Request initiated'],
            requiredActions: ['EXECUTE_TIME_DELAY_REQUEST']
          },
          {
            from: 'PENDING',
            to: 'COMPLETED',
            conditions: ['Time delay elapsed'],
            requiredActions: ['EXECUTE_TIME_DELAY_APPROVE']
          }
        ],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(workflow, 'SecureOwnable')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.score).toBeGreaterThanOrEqual(80)
    })

    it('should detect invalid workflow structure', () => {
      const invalidWorkflow: Workflow = {
        id: '',
        name: '',
        type: 'HYBRID',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(invalidWorkflow, 'SecureOwnable')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Workflow must have an ID')
      expect(result.errors).toContain('Workflow must have a name')
      expect(result.errors).toContain('Workflow must have at least one operation')
    })

    it('should detect invalid state transitions', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'TIME_DELAY_ONLY',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'OWNERSHIP_TRANSFER',
          functions: [],
          roles: [],
          requiredActions: [],
          stateTransitions: []
        }],
        stateTransitions: [
          {
            from: 'COMPLETED',
            to: 'UNDEFINED', // Invalid transition
            conditions: [],
            requiredActions: []
          }
        ],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(workflow, 'SecureOwnable')

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => 
        error.includes('Invalid state transition')
      )).toBe(true)
    })

    it('should validate SecureOwnable specific requirements', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'HYBRID',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'CUSTOM', // Invalid for SecureOwnable
          functions: [],
          roles: [],
          requiredActions: [],
          stateTransitions: []
        }],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(workflow, 'SecureOwnable')

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => 
        error.includes('Invalid operation type CUSTOM for SecureOwnable workflow')
      )).toBe(true)
    })

    it('should validate MultiPhase specific requirements', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'HYBRID',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'SYSTEM_OPERATION',
          functions: [],
          roles: [],
          requiredActions: [], // Missing required actions
          stateTransitions: []
        }],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(workflow, 'MultiPhaseSecureOperation')

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => 
        error.includes('MultiPhase operation must have time-delay or meta-transaction actions')
      )).toBe(true)
    })

    it('should validate DynamicRBAC specific requirements', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'META_TX_ONLY',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'ROLE_EDITING_TOGGLE',
          functions: [],
          roles: [], // Missing BROADCASTER_ROLE
          requiredActions: [],
          stateTransitions: []
        }],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(workflow, 'DynamicRBAC')

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => 
        error.includes('DynamicRBAC operation must have BROADCASTER_ROLE')
      )).toBe(true)
    })
  })

  describe('classifyWorkflow', () => {
    it('should classify HYBRID workflow correctly', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'HYBRID',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'OWNERSHIP_TRANSFER',
          functions: [],
          roles: [],
          requiredActions: ['EXECUTE_TIME_DELAY_REQUEST', 'EXECUTE_META_APPROVE'],
          stateTransitions: []
        }],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.classifyWorkflow(workflow)
      expect(result).toBe('HYBRID')
    })

    it('should classify TIME_DELAY_ONLY workflow correctly', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'TIME_DELAY_ONLY',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'OWNERSHIP_TRANSFER',
          functions: [],
          roles: [],
          requiredActions: ['EXECUTE_TIME_DELAY_REQUEST', 'EXECUTE_TIME_DELAY_APPROVE'],
          stateTransitions: []
        }],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.classifyWorkflow(workflow)
      expect(result).toBe('TIME_DELAY_ONLY')
    })

    it('should classify META_TX_ONLY workflow correctly', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'META_TX_ONLY',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'ROLE_EDITING_TOGGLE',
          functions: [],
          roles: [],
          requiredActions: ['EXECUTE_META_REQUEST_AND_APPROVE'],
          stateTransitions: []
        }],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.classifyWorkflow(workflow)
      expect(result).toBe('META_TX_ONLY')
    })

    it('should classify BROKEN workflow correctly', () => {
      const workflow: Workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'BROKEN',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'OWNERSHIP_TRANSFER',
          functions: [],
          roles: [],
          requiredActions: [], // No actions
          stateTransitions: []
        }],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.classifyWorkflow(workflow)
      expect(result).toBe('BROKEN')
    })
  })

  describe('edge cases', () => {
    it('should handle empty workflows gracefully', () => {
      const emptyWorkflow: Workflow = {
        id: 'empty-workflow',
        name: 'Empty Workflow',
        type: 'META_TX_ONLY',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [],
        stateTransitions: [],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(emptyWorkflow, 'Generic')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Workflow must have at least one operation')
    })

    it('should detect cycles in state transitions', () => {
      const workflow: Workflow = {
        id: 'cyclic-workflow',
        name: 'Cyclic Workflow',
        type: 'HYBRID',
        contractAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        operations: [{
          id: 'test-op',
          type: 'OWNERSHIP_TRANSFER',
          functions: [],
          roles: [],
          requiredActions: [],
          stateTransitions: []
        }],
        stateTransitions: [
          {
            from: 'PENDING',
            to: 'COMPLETED',
            conditions: [],
            requiredActions: []
          },
          {
            from: 'COMPLETED',
            to: 'PENDING', // Creates a cycle
            conditions: [],
            requiredActions: []
          }
        ],
        isValid: true,
        validationErrors: []
      }

      const result = validator.validateWorkflow(workflow, 'Generic')

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => 
        error.includes('Workflow contains cycles in state transitions')
      )).toBe(true)
    })
  })
})
