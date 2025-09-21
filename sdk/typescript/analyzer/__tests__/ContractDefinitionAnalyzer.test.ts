// SPDX-License-Identifier: MPL-2.0
import { ContractDefinitionAnalyzer } from '../ContractDefinitionAnalyzer'
import { PublicClient } from 'viem'

describe('ContractDefinitionAnalyzer', () => {
  let analyzer: ContractDefinitionAnalyzer
  let mockClient: PublicClient

  beforeEach(() => {
    // Mock client that simulates real blockchain calls
    mockClient = {
      readContract: jest.fn().mockImplementation(async ({ address, functionName }) => {
        console.log(`🔍 Mock blockchain call: ${functionName} on ${address}`)
        
        // Handle Guardian-specific function detection
        if (functionName === 'getSupportedOperationTypes') {
          if (address === '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' || 
              address === '0x0665417be6D5638AF01776593b4d2474Cb944aa9' ||
              address === '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3' ||
              address === '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92') {
            return Promise.resolve(['OWNERSHIP_TRANSFER', 'BROADCASTER_UPDATE', 'RECOVERY_UPDATE'])
          }
        }
        
        // Handle other Guardian functions
        if (functionName === 'getBroadcaster' || functionName === 'getRecovery' || functionName === 'timeLockPeriod') {
          if (address === '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' || 
              address === '0x0665417be6D5638AF01776593b4d2474Cb944aa9' ||
              address === '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3' ||
              address === '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92') {
            return Promise.resolve('0x1234567890123456789012345678901234567890')
          }
        }
        
        if (functionName === 'getSupportedFunctions') {
          if (address === '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' || 
              address === '0x0665417be6D5638AF01776593b4d2474Cb944aa9' ||
              address === '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3' ||
              address === '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92') {
            return Promise.resolve(['transferOwnershipRequest', 'updateBroadcasterRequest', 'updateRecoveryRequest'])
          }
        }
        
        // Simulate SecureOwnableDefinitions responses
        if (address === '0xff40f080211F22c762669C42c5CAe0b563CB6373') {
          switch (functionName) {
            case 'getOperationTypes':
              return [
                { operationType: 'OWNERSHIP_TRANSFER', name: 'OWNERSHIP_TRANSFER' },
                { operationType: 'BROADCASTER_UPDATE', name: 'BROADCASTER_UPDATE' },
                { operationType: 'RECOVERY_UPDATE', name: 'RECOVERY_UPDATE' },
                { operationType: 'TIMELOCK_UPDATE', name: 'TIMELOCK_UPDATE' }
              ]
            case 'getFunctionSchemas':
              return [
                {
                  functionName: 'transferOwnershipRequest',
                  functionSelector: '0x12345678',
                  operationType: 'OWNERSHIP_TRANSFER',
                  supportedActions: [0] // EXECUTE_TIME_DELAY_REQUEST
                },
                {
                  functionName: 'transferOwnershipDelayedApproval',
                  functionSelector: '0x87654321',
                  operationType: 'OWNERSHIP_TRANSFER',
                  supportedActions: [1] // EXECUTE_TIME_DELAY_APPROVE
                },
                {
                  functionName: 'transferOwnershipMetaApproval',
                  functionSelector: '0xabcdef12',
                  operationType: 'OWNERSHIP_TRANSFER',
                  supportedActions: [4] // EXECUTE_META_APPROVE
                },
                {
                  functionName: 'updateBroadcasterRequest',
                  functionSelector: '0x11111111',
                  operationType: 'BROADCASTER_UPDATE',
                  supportedActions: [0] // EXECUTE_TIME_DELAY_REQUEST
                },
                {
                  functionName: 'updateBroadcasterDelayedApproval',
                  functionSelector: '0x22222222',
                  operationType: 'BROADCASTER_UPDATE',
                  supportedActions: [1] // EXECUTE_TIME_DELAY_APPROVE
                },
                {
                  functionName: 'updateBroadcasterMetaApproval',
                  functionSelector: '0x33333333',
                  operationType: 'BROADCASTER_UPDATE',
                  supportedActions: [4] // EXECUTE_META_APPROVE
                },
                {
                  functionName: 'updateRecoveryRequestAndApprove',
                  functionSelector: '0x44444444',
                  operationType: 'RECOVERY_UPDATE',
                  supportedActions: [8] // EXECUTE_META_REQUEST_AND_APPROVE
                },
                {
                  functionName: 'updateTimeLockPeriodRequestAndApprove',
                  functionSelector: '0x55555555',
                  operationType: 'TIMELOCK_UPDATE',
                  supportedActions: [8] // EXECUTE_META_REQUEST_AND_APPROVE
                }
              ]
            case 'getRolePermissions':
              return [
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0x12345678',
                  grantedActions: [0]
                },
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0x87654321',
                  grantedActions: [1]
                },
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0xabcdef12',
                  grantedActions: [4]
                },
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0x11111111',
                  grantedActions: [0]
                },
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0x22222222',
                  grantedActions: [1]
                },
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0x33333333',
                  grantedActions: [4]
                },
                {
                  roleHash: '0xRECOVERY_ROLE',
                  functionSelector: '0x44444444',
                  grantedActions: [8]
                },
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0x55555555',
                  grantedActions: [8]
                }
              ]
          }
        }
        
        // Simulate MultiPhaseSecureOperationDefinitions responses
        if (address === '0x31A98eE1a373d748361800BD77a4613b7Fb04dFC') {
          switch (functionName) {
            case 'getOperationTypes':
              return [{ operationType: 'SYSTEM_OPERATION', name: 'SYSTEM_OPERATION' }]
            case 'getFunctionSchemas':
              return [
                {
                  functionName: 'txRequest',
                  functionSelector: '0x66666666',
                  operationType: 'SYSTEM_OPERATION',
                  supportedActions: [0]
                },
                {
                  functionName: 'txDelayedApproval',
                  functionSelector: '0x77777777',
                  operationType: 'SYSTEM_OPERATION',
                  supportedActions: [1]
                },
                {
                  functionName: 'txApprovalWithMetaTx',
                  functionSelector: '0x88888888',
                  operationType: 'SYSTEM_OPERATION',
                  supportedActions: [4]
                },
                {
                  functionName: 'requestAndApprove',
                  functionSelector: '0x99999999',
                  operationType: 'SYSTEM_OPERATION',
                  supportedActions: [8]
                }
              ]
            case 'getRolePermissions':
              return [
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0x66666666',
                  grantedActions: [0]
                },
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0x77777777',
                  grantedActions: [1]
                },
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0x88888888',
                  grantedActions: [4]
                }
              ]
          }
        }
        
        // Simulate DynamicRBACDefinitions responses
        if (address === '0xe34718f0Ee4E56F80E564Bed8a7Eb4b2D06F2864') {
          switch (functionName) {
            case 'getOperationTypes':
              return [{ operationType: 'ROLE_EDITING_TOGGLE', name: 'ROLE_EDITING_TOGGLE' }]
            case 'getFunctionSchemas':
              return [
                {
                  functionName: 'updateRoleEditingToggleRequestAndApprove',
                  functionSelector: '0xaaaaaaaa',
                  operationType: 'ROLE_EDITING_TOGGLE',
                  supportedActions: [8]
                }
              ]
            case 'getRolePermissions':
              return [
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0xaaaaaaaa',
                  grantedActions: [8]
                }
              ]
          }
        }
        
        throw new Error(`Function ${functionName} not found on ${address}`)
      })
    } as unknown as PublicClient

    analyzer = new ContractDefinitionAnalyzer(mockClient)
  })

  describe('analyzeContract', () => {
    it('should analyze SecureOwnable contracts correctly', async () => {
      const contractAddress = '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93'
      
      const analysis = await analyzer.analyzeContract(contractAddress)
      
      expect(analysis.contractAddress).toBe(contractAddress)
      expect(analysis.definitionType).toBe('SecureOwnable')
      expect(analysis.operationTypes.map(op => op.name)).toContain('OWNERSHIP_TRANSFER')
      expect(analysis.operationTypes.map(op => op.name)).toContain('BROADCASTER_UPDATE')
      expect(analysis.operationTypes.map(op => op.name)).toContain('RECOVERY_UPDATE')
      expect(analysis.operationTypes.map(op => op.name)).toContain('TIMELOCK_UPDATE')

      expect(analysis.functionSchemas).toHaveLength(8)
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('transferOwnershipRequest')
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('transferOwnershipDelayedApproval')
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('transferOwnershipMetaApproval')
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('updateRecoveryRequestAndApprove')
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('updateTimeLockPeriodRequestAndApprove')

      expect(analysis.rolePermissions).toHaveLength(8)
      expect(analysis.rolePermissions.some(r => r.roleHash.includes('OWNER_ROLE'))).toBe(true)
      expect(analysis.rolePermissions.some(r => r.roleHash.includes('RECOVERY_ROLE'))).toBe(true)
      expect(analysis.rolePermissions.some(r => r.roleHash.includes('BROADCASTER_ROLE'))).toBe(true)
    })

    it('should analyze MultiPhaseSecureOperation contracts correctly', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890'
      
      const analysis = await analyzer.analyzeContract(contractAddress)
      
      expect(analysis.contractAddress).toBe(contractAddress)
      expect(analysis.definitionType).toBe('MultiPhaseSecureOperation')
      expect(analysis.operationTypes[0].name).toBe('SYSTEM_OPERATION')

      expect(analysis.functionSchemas).toHaveLength(4)
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('txRequest')
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('txDelayedApproval')
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('txApprovalWithMetaTx')
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('requestAndApprove')

      expect(analysis.rolePermissions).toHaveLength(3)
      expect(analysis.rolePermissions.some(r => r.roleHash.includes('OWNER_ROLE'))).toBe(true)
      expect(analysis.rolePermissions.some(r => r.roleHash.includes('BROADCASTER_ROLE'))).toBe(true)
    })

    it('should analyze DynamicRBAC contracts correctly', async () => {
      const contractAddress = '0xA5682DF1987D214Fe4dfC3a262179eBDc205b525'
      
      const analysis = await analyzer.analyzeContract(contractAddress)
      
      expect(analysis.contractAddress).toBe(contractAddress)
      expect(analysis.definitionType).toBe('DynamicRBAC')
      expect(analysis.operationTypes[0].name).toBe('ROLE_EDITING_TOGGLE')

      expect(analysis.functionSchemas).toHaveLength(1)
      expect(analysis.functionSchemas.map(f => f.functionName)).toContain('updateRoleEditingToggleRequestAndApprove')

      expect(analysis.rolePermissions).toHaveLength(1)
      expect(analysis.rolePermissions.some(r => r.roleHash.includes('BROADCASTER_ROLE'))).toBe(true)
    })

    it('should handle generic contracts', async () => {
      const contractAddress = '0x0000000000000000000000000000000000000000'
      
      const analysis = await analyzer.analyzeContract(contractAddress)
      
      expect(analysis.contractAddress).toBe(contractAddress)
      expect(analysis.definitionType).toBe('Generic')
      expect(analysis.operationTypes).toHaveLength(0)
      expect(analysis.functionSchemas).toHaveLength(0)
      expect(analysis.rolePermissions).toHaveLength(0)
    })
  })

  describe('generateWorkflows', () => {
    it('should generate correct workflow types for SecureOwnable', async () => {
      const contractAddress = '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93'
      const analysis = await analyzer.analyzeContract(contractAddress)
      const workflows = analyzer.generateWorkflows(analysis)
      
      expect(workflows).toHaveLength(4)
      
      // Check workflow types based on your requirements:
      // transferOwnership: HYBRID (TIME_DELAY_REQUEST + [TIME_DELAY_APPROVE | META_APPROVE])
      const ownershipWorkflow = workflows.find(w => w.operations[0].type === 'OWNERSHIP_TRANSFER')
      expect(ownershipWorkflow?.type).toBe('HYBRID')
      
      // updateBroadcaster: HYBRID (TIME_DELAY_REQUEST + [TIME_DELAY_APPROVE | META_APPROVE])
      const broadcasterWorkflow = workflows.find(w => w.operations[0].type === 'BROADCASTER_UPDATE')
      expect(broadcasterWorkflow?.type).toBe('HYBRID')
      
      // updateRecovery: META_TX_ONLY (REQUEST_AND_APPROVE)
      const recoveryWorkflow = workflows.find(w => w.operations[0].type === 'RECOVERY_UPDATE')
      expect(recoveryWorkflow?.type).toBe('META_TX_ONLY')
      
      // updateTimeLock: META_TX_ONLY (REQUEST_AND_APPROVE)
      const timelockWorkflow = workflows.find(w => w.operations[0].type === 'TIMELOCK_UPDATE')
      expect(timelockWorkflow?.type).toBe('META_TX_ONLY')
    })
  })
})