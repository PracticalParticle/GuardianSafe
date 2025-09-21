// SPDX-License-Identifier: MPL-2.0
// Enhanced Integration Tests with Proper Mock Client

import { WorkflowAnalyzer } from '../WorkflowAnalyzer'
import { ContractDefinitionAnalyzer } from '../ContractDefinitionAnalyzer'
import { mockClientFactory } from './MockClientFactory'

describe('Enhanced Guardian Workflow Analyzer Integration Tests', () => {
  let analyzer: WorkflowAnalyzer
  let contractAnalyzer: ContractDefinitionAnalyzer
  let mockClient: any

  beforeAll(async () => {
    // Create mock client using factory
    mockClient = mockClientFactory.createMockClient()
    
    // Create analyzers with mock client
    contractAnalyzer = new ContractDefinitionAnalyzer(mockClient)
    analyzer = new WorkflowAnalyzer(mockClient)
  })

  describe('Contract Type Detection', () => {
    it('should correctly detect SecureOwnable contracts', async () => {
      const contractAddress = '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' as `0x${string}`
      
      const analysis = await contractAnalyzer.analyzeContract(contractAddress)
      
      expect(analysis.contractAddress).toBe(contractAddress)
      expect(analysis.definitionType).toBe('SecureOwnable')
      expect(analysis.operationTypes.length).toBeGreaterThan(0)
      expect(analysis.functionSchemas.length).toBeGreaterThan(0)
      expect(analysis.rolePermissions.length).toBeGreaterThan(0)
    })

    it('should correctly detect DynamicRBAC contracts', async () => {
      const contractAddress = '0x0665417be6D5638AF01776593b4d2474Cb944aa9' as `0x${string}`
      
      const analysis = await contractAnalyzer.analyzeContract(contractAddress)
      
      expect(analysis.contractAddress).toBe(contractAddress)
      expect(analysis.definitionType).toBe('DynamicRBAC')
      expect(analysis.operationTypes.length).toBeGreaterThan(0)
      expect(analysis.functionSchemas.length).toBeGreaterThan(0)
      expect(analysis.rolePermissions.length).toBeGreaterThan(0)
    })

    it('should correctly detect MultiPhaseSecureOperation contracts', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
      
      const analysis = await contractAnalyzer.analyzeContract(contractAddress)
      
      expect(analysis.contractAddress).toBe(contractAddress)
      expect(analysis.definitionType).toBe('MultiPhaseSecureOperation')
      expect(analysis.operationTypes.length).toBeGreaterThan(0)
      expect(analysis.functionSchemas.length).toBeGreaterThan(0)
      expect(analysis.rolePermissions.length).toBeGreaterThan(0)
    })
  })

  describe('Workflow Generation', () => {
    it('should generate workflows for SecureOwnable contracts', async () => {
      const contractAddress = '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' as `0x${string}`
      
      const analysis = await contractAnalyzer.analyzeContract(contractAddress)
      const workflows = await analyzer.generateWorkflows(contractAddress)
      
      expect(workflows.length).toBeGreaterThan(0)
      
      // Check for expected workflow types
      const workflowTypes = workflows.map(w => w.type)
      expect(workflowTypes).toContain('HYBRID') // transferOwnership
      expect(workflowTypes).toContain('META_TX_ONLY') // recovery operations
    })

    it('should generate workflows for DynamicRBAC contracts', async () => {
      const contractAddress = '0x0665417be6D5638AF01776593b4d2474Cb944aa9' as `0x${string}`
      
      const analysis = await contractAnalyzer.analyzeContract(contractAddress)
      const workflows = await analyzer.generateWorkflows(contractAddress)
      
      expect(workflows.length).toBeGreaterThan(0)
      
      // Check for expected workflow types
      const workflowTypes = workflows.map(w => w.type)
      expect(workflowTypes).toContain('HYBRID') // role editing operations
    })

    it('should generate workflows for MultiPhaseSecureOperation contracts', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
      
      const analysis = await contractAnalyzer.analyzeContract(contractAddress)
      const workflows = await analyzer.generateWorkflows(contractAddress)
      
      expect(workflows.length).toBeGreaterThan(0)
      
      // Check for expected workflow types
      const workflowTypes = workflows.map(w => w.type)
      expect(workflowTypes).toContain('TIME_DELAY_REQUEST') // txRequest
      expect(workflowTypes).toContain('TIME_DELAY_APPROVE') // txDelayedApproval
    })
  })

  describe('Protocol Compliance', () => {
    it('should check compliance for SecureOwnable contracts', async () => {
      const contractAddress = '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' as `0x${string}`
      
      const compliance = await analyzer.checkProtocolCompliance(contractAddress)
      
      expect(compliance.score).toBeGreaterThan(50)
      expect(compliance.violations.length).toBeLessThanOrEqual(5) // Allow some violations for mock data
    })

    it('should check compliance for DynamicRBAC contracts', async () => {
      const contractAddress = '0x0665417be6D5638AF01776593b4d2474Cb944aa9' as `0x${string}`
      
      const compliance = await analyzer.checkProtocolCompliance(contractAddress)
      
      expect(compliance.score).toBeGreaterThan(50)
      expect(compliance.violations.length).toBeLessThanOrEqual(5) // Allow some violations for mock data
    })

    it('should check compliance for MultiPhaseSecureOperation contracts', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
      
      const compliance = await analyzer.checkProtocolCompliance(contractAddress)
      
      expect(compliance.score).toBeGreaterThan(50)
      expect(compliance.violations.length).toBeLessThanOrEqual(5) // Allow some violations for mock data
    })
  })

  describe('Workflow Statistics', () => {
    it('should analyze workflow statistics for all contract types', async () => {
      const contracts = [
        { name: 'SecureOwnable', address: '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' as `0x${string}` },
        { name: 'DynamicRBAC', address: '0x0665417be6D5638AF01776593b4d2474Cb944aa9' as `0x${string}` },
        { name: 'MultiPhaseSecureOperation', address: '0x1234567890123456789012345678901234567890' as `0x${string}` }
      ]

      for (const contract of contracts) {
        const workflows = await analyzer.generateWorkflows(contract.address)
        const stats = analyzer.analyzeWorkflowStatistics(workflows)

        expect(stats.totalWorkflows).toBeGreaterThan(0)
        expect(stats.validWorkflows).toBeGreaterThan(0)
        expect(stats.brokenWorkflows).toBeLessThanOrEqual(workflows.length)
        
        console.log(`✅ ${contract.name} Statistics:`)
        console.log(`   Total Workflows: ${stats.totalWorkflows}`)
        console.log(`   Valid Workflows: ${stats.validWorkflows}`)
        console.log(`   Broken Workflows: ${stats.brokenWorkflows}`)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid contract addresses gracefully', async () => {
      const invalidAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`
      
      const analysis = await contractAnalyzer.analyzeContract(invalidAddress)
      
      expect(analysis.definitionType).toBe('Generic')
      expect(analysis.operationTypes.length).toBe(0)
      expect(analysis.functionSchemas.length).toBe(0)
      expect(analysis.rolePermissions.length).toBe(0)
    })

    it('should handle network errors gracefully', async () => {
      // Create a mock client that throws network errors
      const errorClient = {
        readContract: jest.fn().mockRejectedValue(new Error('Network error'))
      } as any

      const errorAnalyzer = new ContractDefinitionAnalyzer(errorClient)
      const contractAddress = '0xabd688943c065dEB475D7d1c5c829d18aEE185e7' as `0x${string}`
      
      const analysis = await errorAnalyzer.analyzeContract(contractAddress)
      
      expect(analysis.definitionType).toBe('Generic')
      expect(analysis.operationTypes.length).toBe(0)
      expect(analysis.functionSchemas.length).toBe(0)
      expect(analysis.rolePermissions.length).toBe(0)
    })
  })

  describe('Performance Tests', () => {
    it('should analyze contracts within reasonable time', async () => {
      const startTime = Date.now()
      
      const contracts = [
        '0xabd688943c065dEB475D7d1c5c829d18aEE185e7',
        '0x0665417be6D5638AF01776593b4d2474Cb944aa9',
        '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3',
        '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92'
      ]

      for (const address of contracts) {
        await contractAnalyzer.analyzeContract(address as `0x${string}`)
      }
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      console.log(`✅ Performance test completed in ${duration}ms`)
    })
  })
})
