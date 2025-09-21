// SPDX-License-Identifier: MPL-2.0
// Mock Client Factory for Guardian Analyzer Tests

import { PublicClient } from 'viem'

export interface MockContractConfig {
  address: string
  type: 'SecureOwnable' | 'DynamicRBAC' | 'MultiPhaseSecureOperation' | 'Generic'
  functions: string[]
  operationTypes?: string[]
  functionSchemas?: Array<{ name: string; operationType: string }>
  rolePermissions?: Array<{ role: string; functions: string[] }>
}

export class MockClientFactory {
  private contracts: Map<string, MockContractConfig> = new Map()
  private definitionLibraries: Map<string, any> = new Map()

  constructor() {
    this.setupDefinitionLibraries()
    this.setupTestContracts()
  }

  private setupDefinitionLibraries() {
    // SecureOwnableDefinitions
    this.definitionLibraries.set('0xff40f080211F22c762669C42c5CAe0b563CB6373', {
      getOperationTypes: () => [
        { operationType: 'OWNERSHIP_TRANSFER', name: 'OWNERSHIP_TRANSFER' },
        { operationType: 'BROADCASTER_UPDATE', name: 'BROADCASTER_UPDATE' },
        { operationType: 'RECOVERY_UPDATE', name: 'RECOVERY_UPDATE' },
        { operationType: 'TIMELOCK_UPDATE', name: 'TIMELOCK_UPDATE' }
      ],
      getFunctionSchemas: () => [
        { functionName: 'transferOwnershipRequest', operationType: 'OWNERSHIP_TRANSFER' },
        { functionName: 'transferOwnershipApproval', operationType: 'OWNERSHIP_TRANSFER' },
        { functionName: 'updateBroadcasterRequest', operationType: 'BROADCASTER_UPDATE' },
        { functionName: 'updateBroadcasterApproval', operationType: 'BROADCASTER_UPDATE' },
        { functionName: 'updateRecoveryRequest', operationType: 'RECOVERY_UPDATE' },
        { functionName: 'updateRecoveryApproval', operationType: 'RECOVERY_UPDATE' }
      ],
      getRolePermissions: () => [
        { role: 'OWNER', functions: ['transferOwnershipRequest', 'transferOwnershipApproval'] },
        { role: 'BROADCASTER', functions: ['updateBroadcasterRequest', 'updateBroadcasterApproval'] },
        { role: 'RECOVERY', functions: ['updateRecoveryRequest', 'updateRecoveryApproval'] }
      ]
    })

    // DynamicRBACDefinitions
    this.definitionLibraries.set('0xe34718f0Ee4E56F80E564Bed8a7Eb4b2D06F2864', {
      getOperationTypes: () => [
        { operationType: 'ROLE_EDITING_TOGGLE', name: 'ROLE_EDITING_TOGGLE' }
      ],
      getFunctionSchemas: () => [
        { functionName: 'updateRoleEditingToggleRequestAndApprove', operationType: 'ROLE_EDITING_TOGGLE' }
      ],
      getRolePermissions: () => [
        { role: 'ADMIN', functions: ['updateRoleEditingToggleRequestAndApprove'] }
      ]
    })

    // MultiPhaseSecureOperationDefinitions
    this.definitionLibraries.set('0x31A98eE1a373d748361800BD77a4613b7Fb04dFC', {
      getOperationTypes: () => [
        { operationType: 'SYSTEM_OPERATION', name: 'SYSTEM_OPERATION' }
      ],
      getFunctionSchemas: () => [
        { functionName: 'txRequest', operationType: 'SYSTEM_OPERATION' },
        { functionName: 'txDelayedApproval', operationType: 'SYSTEM_OPERATION' },
        { functionName: 'txCancellation', operationType: 'SYSTEM_OPERATION' },
        { functionName: 'txMetaTransaction', operationType: 'SYSTEM_OPERATION' }
      ],
      getRolePermissions: () => [
        { role: 'SYSTEM', functions: ['txRequest', 'txDelayedApproval', 'txCancellation', 'txMetaTransaction'] }
      ]
    })
  }

  private setupTestContracts() {
    // GuardianAccountAbstraction (SecureOwnable)
    this.contracts.set('0xabd688943c065dEB475D7d1c5c829d18aEE185e7', {
      address: '0xabd688943c065dEB475D7d1c5c829d18aEE185e7',
      type: 'SecureOwnable',
      functions: [
        'getSupportedOperationTypes',
        'getSupportedFunctions',
        'transferOwnershipRequest',
        'getBroadcaster',
        'getRecovery',
        'timeLockPeriod'
      ],
      operationTypes: ['OWNERSHIP_TRANSFER', 'BROADCASTER_UPDATE', 'RECOVERY_UPDATE'],
      functionSchemas: [
        { name: 'transferOwnershipRequest', operationType: 'OWNERSHIP_TRANSFER' },
        { name: 'updateBroadcasterRequest', operationType: 'BROADCASTER_UPDATE' },
        { name: 'updateRecoveryRequest', operationType: 'RECOVERY_UPDATE' }
      ],
      rolePermissions: [
        { role: 'OWNER', functions: ['transferOwnershipRequest'] },
        { role: 'BROADCASTER', functions: ['updateBroadcasterRequest'] },
        { role: 'RECOVERY', functions: ['updateRecoveryRequest'] }
      ]
    })

    // GuardianAccountAbstractionWithRoles (DynamicRBAC)
    this.contracts.set('0x0665417be6D5638AF01776593b4d2474Cb944aa9', {
      address: '0x0665417be6D5638AF01776593b4d2474Cb944aa9',
      type: 'DynamicRBAC',
      functions: [
        'getSupportedOperationTypes',
        'getSupportedFunctions',
        'updateRoleEditingToggleRequestAndApprove',
        'getBroadcaster',
        'getRecovery',
        'timeLockPeriod'
      ],
      operationTypes: ['ROLE_EDITING_TOGGLE'],
      functionSchemas: [
        { name: 'updateRoleEditingToggleRequestAndApprove', operationType: 'ROLE_EDITING_TOGGLE' }
      ],
      rolePermissions: [
        { role: 'ADMIN', functions: ['updateRoleEditingToggleRequestAndApprove'] }
      ]
    })

    // SimpleVault (SecureOwnable)
    this.contracts.set('0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3', {
      address: '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3',
      type: 'SecureOwnable',
      functions: [
        'getSupportedOperationTypes',
        'getSupportedFunctions',
        'transferOwnershipRequest',
        'getBroadcaster',
        'getRecovery',
        'timeLockPeriod'
      ],
      operationTypes: ['OWNERSHIP_TRANSFER', 'BROADCASTER_UPDATE', 'RECOVERY_UPDATE'],
      functionSchemas: [
        { name: 'transferOwnershipRequest', operationType: 'OWNERSHIP_TRANSFER' },
        { name: 'updateBroadcasterRequest', operationType: 'BROADCASTER_UPDATE' },
        { name: 'updateRecoveryRequest', operationType: 'RECOVERY_UPDATE' }
      ],
      rolePermissions: [
        { role: 'OWNER', functions: ['transferOwnershipRequest'] },
        { role: 'BROADCASTER', functions: ['updateBroadcasterRequest'] },
        { role: 'RECOVERY', functions: ['updateRecoveryRequest'] }
      ]
    })

    // SimpleRWA20 (SecureOwnable)
    this.contracts.set('0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92', {
      address: '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92',
      type: 'SecureOwnable',
      functions: [
        'getSupportedOperationTypes',
        'getSupportedFunctions',
        'transferOwnershipRequest',
        'getBroadcaster',
        'getRecovery',
        'timeLockPeriod'
      ],
      operationTypes: ['OWNERSHIP_TRANSFER', 'BROADCASTER_UPDATE', 'RECOVERY_UPDATE'],
      functionSchemas: [
        { name: 'transferOwnershipRequest', operationType: 'OWNERSHIP_TRANSFER' },
        { name: 'updateBroadcasterRequest', operationType: 'BROADCASTER_UPDATE' },
        { name: 'updateRecoveryRequest', operationType: 'RECOVERY_UPDATE' }
      ],
      rolePermissions: [
        { role: 'OWNER', functions: ['transferOwnershipRequest'] },
        { role: 'BROADCASTER', functions: ['updateBroadcasterRequest'] },
        { role: 'RECOVERY', functions: ['updateRecoveryRequest'] }
      ]
    })

    // MultiPhase contract
    this.contracts.set('0x1234567890123456789012345678901234567890', {
      address: '0x1234567890123456789012345678901234567890',
      type: 'MultiPhaseSecureOperation',
      functions: ['txRequest', 'txDelayedApproval', 'txCancellation', 'txMetaTransaction'],
      operationTypes: ['SYSTEM_OPERATION'],
      functionSchemas: [
        { name: 'txRequest', operationType: 'SYSTEM_OPERATION' },
        { name: 'txDelayedApproval', operationType: 'SYSTEM_OPERATION' },
        { name: 'txCancellation', operationType: 'SYSTEM_OPERATION' },
        { name: 'txMetaTransaction', operationType: 'SYSTEM_OPERATION' }
      ],
      rolePermissions: [
        { role: 'SYSTEM', functions: ['txRequest', 'txDelayedApproval', 'txCancellation', 'txMetaTransaction'] }
      ]
    })
  }

  createMockClient(): PublicClient {
    return {
      readContract: jest.fn().mockImplementation(({ address, functionName }) => {
        // Check if it's a definition library call
        if (this.definitionLibraries.has(address)) {
          const library = this.definitionLibraries.get(address)
          if (library[functionName]) {
            return Promise.resolve(library[functionName]())
          }
        }

        // Check if it's a contract call
        const contract = this.contracts.get(address)
        if (contract) {
          // Handle Guardian-specific functions
          if (functionName === 'getSupportedOperationTypes') {
            return Promise.resolve(contract.operationTypes || [])
          }
          if (functionName === 'getSupportedFunctions') {
            return Promise.resolve(contract.functionSchemas?.map(fs => fs.name) || [])
          }
          
          // Check if function exists on contract
          if (contract.functions.includes(functionName)) {
            return Promise.resolve('0x1234567890123456789012345678901234567890')
          }
        }

        // Function doesn't exist
        throw new Error('Function not found')
      })
    } as any
  }

  getContractConfig(address: string): MockContractConfig | undefined {
    return this.contracts.get(address)
  }

  addContract(config: MockContractConfig) {
    this.contracts.set(config.address, config)
  }

  removeContract(address: string) {
    this.contracts.delete(address)
  }
}

export const mockClientFactory = new MockClientFactory()
