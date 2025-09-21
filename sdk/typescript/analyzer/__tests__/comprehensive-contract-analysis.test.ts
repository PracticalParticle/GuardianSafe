// SPDX-License-Identifier: MPL-2.0
import { ContractDefinitionAnalyzer } from '../ContractDefinitionAnalyzer'
import { PublicClient } from 'viem'

describe('Comprehensive Contract Analysis - All 4 Contracts', () => {
  let analyzer: ContractDefinitionAnalyzer
  let mockClient: PublicClient

  beforeEach(() => {
    // Mock client that simulates real blockchain calls for all definition libraries
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
                { operationType: 'TIMELOCK_UPDATE', name: 'TIMELOCK_UPDATE' },
                { operationType: 'WITHDRAW_ETH', name: 'WITHDRAW_ETH' },
                { operationType: 'WITHDRAW_TOKEN', name: 'WITHDRAW_TOKEN' },
                { operationType: 'MINT_TOKENS', name: 'MINT_TOKENS' },
                { operationType: 'BURN_TOKENS', name: 'BURN_TOKENS' }
              ]
            case 'getFunctionSchemas':
              return [
                // GuardianAccountAbstraction functions
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
                },
                // SimpleVault functions
                {
                  functionName: 'withdrawEthRequest',
                  functionSelector: '0x66666666',
                  operationType: 'WITHDRAW_ETH',
                  supportedActions: [0] // EXECUTE_TIME_DELAY_REQUEST
                },
                {
                  functionName: 'withdrawEthDelayedApproval',
                  functionSelector: '0x77777777',
                  operationType: 'WITHDRAW_ETH',
                  supportedActions: [1] // EXECUTE_TIME_DELAY_APPROVE
                },
                {
                  functionName: 'withdrawEthMetaApproval',
                  functionSelector: '0x88888888',
                  operationType: 'WITHDRAW_ETH',
                  supportedActions: [4] // EXECUTE_META_APPROVE
                },
                {
                  functionName: 'withdrawTokenRequest',
                  functionSelector: '0x99999999',
                  operationType: 'WITHDRAW_TOKEN',
                  supportedActions: [0] // EXECUTE_TIME_DELAY_REQUEST
                },
                {
                  functionName: 'withdrawTokenDelayedApproval',
                  functionSelector: '0xaaaaaaaa',
                  operationType: 'WITHDRAW_TOKEN',
                  supportedActions: [1] // EXECUTE_TIME_DELAY_APPROVE
                },
                {
                  functionName: 'withdrawTokenMetaApproval',
                  functionSelector: '0xbbbbbbbb',
                  operationType: 'WITHDRAW_TOKEN',
                  supportedActions: [4] // EXECUTE_META_APPROVE
                },
                // SimpleRWA20 functions
                {
                  functionName: 'mintWithMetaTx',
                  functionSelector: '0xcccccccc',
                  operationType: 'MINT_TOKENS',
                  supportedActions: [8] // EXECUTE_META_REQUEST_AND_APPROVE
                },
                {
                  functionName: 'burnWithMetaTx',
                  functionSelector: '0xdddddddd',
                  operationType: 'BURN_TOKENS',
                  supportedActions: [8] // EXECUTE_META_REQUEST_AND_APPROVE
                }
              ]
            case 'getRolePermissions':
              return [
                // GuardianAccountAbstraction role permissions
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
                },
                // SimpleVault role permissions
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
                },
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0x99999999',
                  grantedActions: [0]
                },
                {
                  roleHash: '0xOWNER_ROLE',
                  functionSelector: '0xaaaaaaaa',
                  grantedActions: [1]
                },
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0xbbbbbbbb',
                  grantedActions: [4]
                },
                // SimpleRWA20 role permissions
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0xcccccccc',
                  grantedActions: [8]
                },
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0xdddddddd',
                  grantedActions: [8]
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
                  functionSelector: '0xeeeeeeee',
                  operationType: 'ROLE_EDITING_TOGGLE',
                  supportedActions: [8] // EXECUTE_META_REQUEST_AND_APPROVE
                }
              ]
            case 'getRolePermissions':
              return [
                {
                  roleHash: '0xBROADCASTER_ROLE',
                  functionSelector: '0xeeeeeeee',
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

  describe('All 4 Contract Analysis', () => {
    const contracts = [
      {
        name: 'GuardianAccountAbstraction',
        address: '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93',
        expectedType: 'SecureOwnable',
        expectedWorkflows: 4
      },
      {
        name: 'GuardianAccountAbstractionWithRoles',
        address: '0xA5682DF1987D214Fe4dfC3a262179eBDc205b525',
        expectedType: 'DynamicRBAC',
        expectedWorkflows: 1
      },
      {
        name: 'SimpleVault',
        address: '0x430316d13cB31B834174D8d4223c5d5599209f79',
        expectedType: 'SecureOwnable',
        expectedWorkflows: 6 // 4 base + 2 vault-specific
      },
      {
        name: 'SimpleRWA20',
        address: '0x365fE252c93E161619E21cF135ae86CD4C031466',
        expectedType: 'SecureOwnable',
        expectedWorkflows: 6 // 4 base + 2 token-specific
      }
    ]

    contracts.forEach(contract => {
      it(`should analyze ${contract.name} correctly`, async () => {
        console.log(`\n🔍 Analyzing ${contract.name} at ${contract.address}`)
        
        const analysis = await analyzer.analyzeContract(contract.address as `0x${string}`)
        
        console.log('📊 Analysis Results:')
        console.log(`   Definition Type: ${analysis.definitionType}`)
        console.log(`   Operation Types: ${analysis.operationTypes.length} found`)
        console.log(`   Function Schemas: ${analysis.functionSchemas.length} found`)
        console.log(`   Role Permissions: ${analysis.rolePermissions.length} found`)
        console.log('')

        // Test assertions
        expect(analysis.contractAddress).toBe(contract.address)
        expect(analysis.definitionType).toBe(contract.expectedType)
        expect(analysis.operationTypes.length).toBeGreaterThan(0)
        expect(analysis.functionSchemas.length).toBeGreaterThan(0)
        expect(analysis.rolePermissions.length).toBeGreaterThan(0)

        // Generate workflows
        const workflows = analyzer.generateWorkflows(analysis)
        console.log('🔄 Generated Workflows:')
        workflows.forEach((workflow, i) => {
          console.log(`   ${i + 1}. ${workflow.name} (${workflow.type})`)
          console.log(`      Operations: ${workflow.operations.length}`)
          console.log(`      Valid: ${workflow.isValid}`)
        })
        console.log('')

        expect(workflows.length).toBeGreaterThan(0)
        
        // Specific workflow type validations based on contract
        if (contract.name === 'GuardianAccountAbstraction') {
          // Should have HYBRID workflows for ownership and broadcaster updates
          const ownershipWorkflow = workflows.find(w => w.operations[0].type === 'OWNERSHIP_TRANSFER')
          expect(ownershipWorkflow?.type).toBe('HYBRID')
          
          const broadcasterWorkflow = workflows.find(w => w.operations[0].type === 'BROADCASTER_UPDATE')
          expect(broadcasterWorkflow?.type).toBe('HYBRID')
          
          // Should have META_TX_ONLY for recovery and timelock
          const recoveryWorkflow = workflows.find(w => w.operations[0].type === 'RECOVERY_UPDATE')
          expect(recoveryWorkflow?.type).toBe('META_TX_ONLY')
          
          const timelockWorkflow = workflows.find(w => w.operations[0].type === 'TIMELOCK_UPDATE')
          expect(timelockWorkflow?.type).toBe('META_TX_ONLY')
        }
        
        if (contract.name === 'GuardianAccountAbstractionWithRoles') {
          // Should have META_TX_ONLY for role editing
          const roleWorkflow = workflows.find(w => w.operations[0].type === 'ROLE_EDITING_TOGGLE')
          expect(roleWorkflow?.type).toBe('META_TX_ONLY')
        }
        
        if (contract.name === 'SimpleVault') {
          // Should have SecureOwnable workflows (inherits from GuardianAccountAbstraction)
          const ownershipWorkflow = workflows.find(w => w.operations[0].type === 'OWNERSHIP_TRANSFER')
          expect(ownershipWorkflow?.type).toBe('HYBRID')
          
          const broadcasterWorkflow = workflows.find(w => w.operations[0].type === 'BROADCASTER_UPDATE')
          expect(broadcasterWorkflow?.type).toBe('HYBRID')
        }
        
        if (contract.name === 'SimpleRWA20') {
          // Should have SecureOwnable workflows (inherits from GuardianAccountAbstraction)
          const ownershipWorkflow = workflows.find(w => w.operations[0].type === 'OWNERSHIP_TRANSFER')
          expect(ownershipWorkflow?.type).toBe('HYBRID')
          
          const recoveryWorkflow = workflows.find(w => w.operations[0].type === 'RECOVERY_UPDATE')
          expect(recoveryWorkflow?.type).toBe('META_TX_ONLY')
        }
      })
    })
  })

  it('should provide comprehensive analysis summary for all contracts', async () => {
    console.log('\n🎯 COMPREHENSIVE ANALYSIS SUMMARY')
    console.log('=' .repeat(60))
    
    const summary = {
      totalContracts: 0,
      workflowTypes: {
        TIME_DELAY_ONLY: 0,
        META_TX_ONLY: 0,
        HYBRID: 0,
        BROKEN: 0
      },
      contractTypes: {
        SecureOwnable: 0,
        DynamicRBAC: 0,
        MultiPhaseSecureOperation: 0,
        Generic: 0
      }
    }

    for (const contract of [
      { name: 'GuardianAccountAbstraction', address: '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93' },
      { name: 'GuardianAccountAbstractionWithRoles', address: '0xA5682DF1987D214Fe4dfC3a262179eBDc205b525' },
      { name: 'SimpleVault', address: '0x430316d13cB31B834174D8d4223c5d5599209f79' },
      { name: 'SimpleRWA20', address: '0x365fE252c93E161619E21cF135ae86CD4C031466' }
    ]) {
      console.log(`\n📋 ${contract.name}:`)
      const analysis = await analyzer.analyzeContract(contract.address as `0x${string}`)
      const workflows = analyzer.generateWorkflows(analysis)
      
      summary.totalContracts++
      summary.contractTypes[analysis.definitionType as keyof typeof summary.contractTypes]++
      
      workflows.forEach(workflow => {
        summary.workflowTypes[workflow.type]++
      })
      
      console.log(`   Type: ${analysis.definitionType}`)
      console.log(`   Workflows: ${workflows.length}`)
      console.log(`   Operations: ${analysis.operationTypes.length}`)
      console.log(`   Functions: ${analysis.functionSchemas.length}`)
      console.log(`   Roles: ${analysis.rolePermissions.length}`)
    }

    console.log('\n📊 FINAL SUMMARY:')
    console.log(`   Total Contracts Analyzed: ${summary.totalContracts}`)
    console.log(`   Contract Types:`)
    Object.entries(summary.contractTypes).forEach(([type, count]) => {
      if (count > 0) console.log(`     - ${type}: ${count}`)
    })
    console.log(`   Workflow Types:`)
    Object.entries(summary.workflowTypes).forEach(([type, count]) => {
      if (count > 0) console.log(`     - ${type}: ${count}`)
    })
    console.log('\n✅ All contracts successfully analyzed!')
  })
})
