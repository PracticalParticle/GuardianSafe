// SPDX-License-Identifier: MPL-2.0
// Contract Integrity Validator - Security Layer for Guardian Framework

import { PublicClient, Address } from 'viem'
import { 
  OperationTypeDefinition, 
  FunctionSchemaDefinition, 
  RolePermissionDefinition,
  ContractAnalysis,
  ComplianceViolation,
  ComplianceResult
} from '../types/WorkflowTypes'

// Use ComplianceViolation directly for consistency
type IntegrityViolation = ComplianceViolation

export interface ContractDefinition {
  operationTypes: OperationTypeDefinition[]
  functionSchemas: FunctionSchemaDefinition[]
  rolePermissions: RolePermissionDefinition[]
}

export interface IntegrityValidationResult {
  isValid: boolean
  score: number
  violations: ComplianceViolation[]
  discrepancies: {
    operationTypes: IntegrityDiscrepancy[]
    functionSchemas: IntegrityDiscrepancy[]
    rolePermissions: IntegrityDiscrepancy[]
  }
}

export interface IntegrityDiscrepancy {
  type: 'MISSING' | 'EXTRA' | 'MODIFIED' | 'TAMPERED'
  libraryValue: any
  contractValue: any
  field: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
}

export class ContractIntegrityValidator {
  private client: PublicClient

  // Definition library addresses
  private readonly DEFINITION_LIBRARIES = {
    SecureOwnableDefinitions: '0xff40f080211F22c762669C42c5CAe0b563CB6373',
    DynamicRBACDefinitions: '0xe34718f0Ee4E56F80E564Bed8a7Eb4b2D06F2864',
    MultiPhaseSecureOperationDefinitions: '0x31A98eE1a373d748361800BD77a4613b7Fb04dFC'
  }

  constructor(client: PublicClient) {
    this.client = client
  }

  /**
   * @dev Validates contract integrity by comparing contract definitions against library definitions
   */
  async validateContractIntegrity(
    contractAddress: Address, 
    contractType: 'SecureOwnable' | 'DynamicRBAC' | 'MultiPhaseSecureOperation'
  ): Promise<IntegrityValidationResult> {
    try {
      // Get definitions from library (expected/standard definitions)
      const libraryDefinitions = await this.getLibraryDefinitions(contractType)
      
      // Get definitions from actual contract (actual implementation)
      const contractDefinitions = await this.getContractDefinitions(contractAddress, contractType)
      
      // Perform detailed comparison between library and contract definitions
      const detailedViolations = this.performDetailedComparison(libraryDefinitions, contractDefinitions, contractType)
      
      // Also perform basic comparison for backward compatibility
      const discrepancies = this.compareDefinitions(libraryDefinitions, contractDefinitions)
      const basicViolations = this.generateViolations(discrepancies)
      
      // Combine all violations
      const violations = [...detailedViolations, ...basicViolations]
      
      // Calculate integrity score based on all violations
      const score = this.calculateIntegrityScoreFromViolations(violations)
      
      return {
        isValid: violations.length === 0,
        score,
        violations,
        discrepancies
      }
    } catch (error) {
      console.error('Contract integrity validation failed:', error)
      return {
        isValid: false,
        score: 0,
        violations: [{
          type: 'PROTOCOL_VIOLATION',
          severity: 'HIGH',
          description: `Integrity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendation: 'Contract integrity cannot be verified'
        }],
        discrepancies: {
          operationTypes: [],
          functionSchemas: [],
          rolePermissions: []
        }
      }
    }
  }

  /**
   * @dev Gets definitions from the appropriate library
   */
  private async getLibraryDefinitions(contractType: string): Promise<ContractDefinition> {
    const libraryAddress = this.getLibraryAddress(contractType)
    
    const [operationTypes, functionSchemas, rolePermissions] = await Promise.all([
      this.client.readContract({
        address: libraryAddress as `0x${string}`,
        abi: [{
          inputs: [],
          name: 'getOperationTypes',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'operationType', type: 'string' },
            { name: 'name', type: 'string' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getOperationTypes'
      }) as unknown as OperationTypeDefinition[],
      
      this.client.readContract({
        address: libraryAddress as `0x${string}`,
        abi: [{
          inputs: [],
          name: 'getFunctionSchemas',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'functionName', type: 'string' },
            { name: 'functionSelector', type: 'string' },
            { name: 'operationType', type: 'string' },
            { name: 'supportedActions', type: 'uint8[]' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getFunctionSchemas'
      }) as unknown as FunctionSchemaDefinition[],
      
      this.client.readContract({
        address: libraryAddress as `0x${string}`,
        abi: [{
          inputs: [],
          name: 'getRolePermissions',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'roleHash', type: 'bytes32' },
            { name: 'functionSelector', type: 'bytes4' },
            { name: 'grantedActions', type: 'uint8[]' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getRolePermissions'
      }) as unknown as RolePermissionDefinition[]
    ])

    return {
      operationTypes: operationTypes || [],
      functionSchemas: functionSchemas || [],
      rolePermissions: rolePermissions || []
    }
  }

  /**
   * @dev Gets definitions from the actual contract
   */
  private async getContractDefinitions(
    contractAddress: Address, 
    contractType: string
  ): Promise<ContractDefinition> {
    try {
      // Get supported operation types from contract
      const supportedOperationTypes = await this.client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: 'getSupportedOperationTypes',
          outputs: [{ name: '', type: 'bytes32[]' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getSupportedOperationTypes'
      }) as string[]

      // Get supported roles from contract
      const supportedRoles = await this.client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: 'getSupportedRoles',
          outputs: [{ name: '', type: 'bytes32[]' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getSupportedRoles'
      }) as string[]

      // Get supported functions from contract
      const supportedFunctions = await this.client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: 'getSupportedFunctions',
          outputs: [{ name: '', type: 'bytes4[]' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getSupportedFunctions'
      }) as string[]

      // Convert contract data to definition format
      return {
        operationTypes: supportedOperationTypes.map((opType, index) => ({
          operationType: opType,
          name: opType,
          description: `Contract operation type ${index}`,
          supportedActions: [],
          requiredRoles: []
        })),
        functionSchemas: supportedFunctions.map((funcSelector, index) => ({
          functionName: `function_${index}`,
          functionSelector: funcSelector,
          operationType: supportedOperationTypes[0] || 'UNKNOWN',
          supportedActions: [],
          parameters: []
        })),
        rolePermissions: supportedRoles.map((roleHash, index) => ({
          roleHash: roleHash,
          functionSelector: supportedFunctions[0] || '0x00000000',
          grantedActions: [],
          conditions: []
        }))
      }
    } catch (error) {
      console.warn(`Failed to get contract definitions for ${contractAddress}:`, error)
      return {
        operationTypes: [],
        functionSchemas: [],
        rolePermissions: []
      }
    }
  }

  /**
   * @dev Performs detailed comparison between definition libraries and actual contract
   * @param libraryDefs Definitions from the standard library
   * @param contractDefs Definitions from the actual contract
   * @param contractType The type of contract being validated
   * @returns Detailed comparison results with specific violations
   */
  private performDetailedComparison(
    libraryDefs: ContractDefinition,
    contractDefs: ContractDefinition,
    contractType: string
  ): IntegrityViolation[] {
    const violations: IntegrityViolation[] = []

    // 1. Compare Operation Types in detail
    violations.push(...this.compareOperationTypesDetailed(libraryDefs.operationTypes, contractDefs.operationTypes))

    // 2. Compare Function Schemas in detail
    violations.push(...this.compareFunctionSchemasDetailed(libraryDefs.functionSchemas, contractDefs.functionSchemas))

    // 3. Compare Role Permissions in detail
    violations.push(...this.compareRolePermissionsDetailed(libraryDefs.rolePermissions, contractDefs.rolePermissions))

    // 4. Check for tampering indicators
    violations.push(...this.detectTamperingIndicators(libraryDefs, contractDefs, contractType))

    return violations
  }

  /**
   * @dev Compares operation types in detail
   */
  private compareOperationTypesDetailed(
    libraryOps: OperationTypeDefinition[],
    contractOps: OperationTypeDefinition[]
  ): IntegrityViolation[] {
    const violations: IntegrityViolation[] = []
    const libraryOpMap = new Map(libraryOps.map(op => [op.operationType, op]))
    const contractOpMap = new Map(contractOps.map(op => [op.operationType, op]))

    // Check for missing operation types in contract
    for (const [opType, libOp] of libraryOpMap) {
      if (!contractOpMap.has(opType)) {
        violations.push({
          type: 'PROTOCOL_VIOLATION',
          severity: 'HIGH',
          description: `Missing operation type '${opType}' in contract. Expected from definition library.`,
          recommendation: `Ensure contract implements operation type '${opType}' as defined in ${libOp.name}`
        })
      } else {
        // Check if the operation type details match
        const contractOp = contractOpMap.get(opType)!
        if (libOp.name !== contractOp.name) {
          violations.push({
            type: 'PROTOCOL_VIOLATION',
            severity: 'MEDIUM',
            description: `Operation type '${opType}' name mismatch: library='${libOp.name}', contract='${contractOp.name}'`,
            recommendation: 'Verify operation type naming consistency between library and contract'
          })
        }
      }
    }

    // Check for unexpected operation types in contract
    for (const [opType, contractOp] of contractOpMap) {
      if (!libraryOpMap.has(opType)) {
        violations.push({
          type: 'PROTOCOL_VIOLATION',
          severity: 'MEDIUM',
          description: `Unexpected operation type '${opType}' found in contract. Not defined in library.`,
          recommendation: 'Verify if this operation type should be added to the definition library'
        })
      }
    }

    return violations
  }

  /**
   * @dev Compares function schemas in detail
   */
  private compareFunctionSchemasDetailed(
    librarySchemas: FunctionSchemaDefinition[],
    contractSchemas: FunctionSchemaDefinition[]
  ): IntegrityViolation[] {
    const violations: IntegrityViolation[] = []
    const librarySchemaMap = new Map(librarySchemas.map(schema => [schema.functionSelector, schema]))
    const contractSchemaMap = new Map(contractSchemas.map(schema => [schema.functionSelector, schema]))

    // Check for missing function schemas in contract
    for (const [selector, libSchema] of librarySchemaMap) {
      if (!contractSchemaMap.has(selector)) {
        violations.push({
          type: 'MISSING_FUNCTION',
          severity: 'HIGH',
          description: `Missing function '${libSchema.functionName}' (${selector}) in contract. Expected from definition library.`,
          recommendation: `Ensure contract implements function '${libSchema.functionName}' as defined in library`
        })
      } else {
        // Check if the function schema details match
        const contractSchema = contractSchemaMap.get(selector)!
        if (libSchema.functionName !== contractSchema.functionName) {
          violations.push({
            type: 'PROTOCOL_VIOLATION',
            severity: 'MEDIUM',
            description: `Function ${selector} name mismatch: library='${libSchema.functionName}', contract='${contractSchema.functionName}'`,
            recommendation: 'Verify function naming consistency between library and contract'
          })
        }
        if (libSchema.operationType !== contractSchema.operationType) {
          violations.push({
            type: 'PROTOCOL_VIOLATION',
            severity: 'HIGH',
            description: `Function ${selector} operation type mismatch: library='${libSchema.operationType}', contract='${contractSchema.operationType}'`,
            recommendation: 'Verify function operation type assignment matches library definition'
          })
        }
      }
    }

    // Check for unexpected function schemas in contract
    for (const [selector, contractSchema] of contractSchemaMap) {
      if (!librarySchemaMap.has(selector)) {
        violations.push({
          type: 'PROTOCOL_VIOLATION',
          severity: 'MEDIUM',
          description: `Unexpected function '${contractSchema.functionName}' (${selector}) found in contract. Not defined in library.`,
          recommendation: 'Verify if this function should be added to the definition library'
        })
      }
    }

    return violations
  }

  /**
   * @dev Compares role permissions in detail
   */
  private compareRolePermissionsDetailed(
    libraryPermissions: RolePermissionDefinition[],
    contractPermissions: RolePermissionDefinition[]
  ): IntegrityViolation[] {
    const violations: IntegrityViolation[] = []
    const libraryPermMap = new Map(libraryPermissions.map(perm => [`${perm.roleHash}-${perm.functionSelector}`, perm]))
    const contractPermMap = new Map(contractPermissions.map(perm => [`${perm.roleHash}-${perm.functionSelector}`, perm]))

    // Check for missing role permissions in contract
    for (const [key, libPerm] of libraryPermMap) {
      if (!contractPermMap.has(key)) {
        violations.push({
          type: 'INVALID_ROLE',
          severity: 'HIGH',
          description: `Missing role permission for role ${libPerm.roleHash} on function ${libPerm.functionSelector}. Expected from definition library.`,
          recommendation: 'Ensure contract implements the same role permissions as defined in library'
        })
      } else {
        // Check if the permission details match
        const contractPerm = contractPermMap.get(key)!
        if (JSON.stringify(libPerm.grantedActions) !== JSON.stringify(contractPerm.grantedActions)) {
          violations.push({
            type: 'INVALID_ROLE',
            severity: 'HIGH',
            description: `Role permission mismatch for role ${libPerm.roleHash} on function ${libPerm.functionSelector}. Actions differ between library and contract.`,
            recommendation: 'Verify role permission actions match library definition'
          })
        }
      }
    }

    // Check for unexpected role permissions in contract
    for (const [key, contractPerm] of contractPermMap) {
      if (!libraryPermMap.has(key)) {
        violations.push({
          type: 'INVALID_ROLE',
          severity: 'MEDIUM',
          description: `Unexpected role permission for role ${contractPerm.roleHash} on function ${contractPerm.functionSelector}. Not defined in library.`,
          recommendation: 'Verify if this role permission should be added to the definition library'
        })
      }
    }

    return violations
  }

  /**
   * @dev Detects potential tampering indicators
   */
  private detectTamperingIndicators(
    libraryDefs: ContractDefinition,
    contractDefs: ContractDefinition,
    contractType: string
  ): IntegrityViolation[] {
    const violations: IntegrityViolation[] = []

    // Check for significant discrepancies that might indicate tampering
    const libraryOpCount = libraryDefs.operationTypes.length
    const contractOpCount = contractDefs.operationTypes.length
    const libraryFuncCount = libraryDefs.functionSchemas.length
    const contractFuncCount = contractDefs.functionSchemas.length

    // Detect if contract has significantly fewer definitions than library
    if (contractOpCount < libraryOpCount * 0.5) {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: 'HIGH',
        description: `Contract has significantly fewer operation types (${contractOpCount}) than library (${libraryOpCount}). Possible tampering.`,
        recommendation: 'Verify contract deployment and initialization. Check for missing operation types.'
      })
    }

    if (contractFuncCount < libraryFuncCount * 0.5) {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: 'HIGH',
        description: `Contract has significantly fewer functions (${contractFuncCount}) than library (${libraryFuncCount}). Possible tampering.`,
        recommendation: 'Verify contract deployment and initialization. Check for missing functions.'
      })
    }

    // Detect if contract has significantly more definitions than library (potential unauthorized additions)
    if (contractOpCount > libraryOpCount * 1.5) {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: 'MEDIUM',
        description: `Contract has significantly more operation types (${contractOpCount}) than library (${libraryOpCount}). Check for unauthorized additions.`,
        recommendation: 'Verify all operation types are legitimate and authorized'
      })
    }

    if (contractFuncCount > libraryFuncCount * 1.5) {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: 'MEDIUM',
        description: `Contract has significantly more functions (${contractFuncCount}) than library (${libraryFuncCount}). Check for unauthorized additions.`,
        recommendation: 'Verify all functions are legitimate and authorized'
      })
    }

    return violations
  }

  /**
   * @dev Calculates integrity score based on violations
   */
  private calculateIntegrityScoreFromViolations(violations: IntegrityViolation[]): number {
    let score = 100
    
    for (const violation of violations) {
      switch (violation.severity) {
        case 'HIGH':
          score -= 20
          break
        case 'MEDIUM':
          score -= 10
          break
        case 'LOW':
          score -= 5
          break
      }
    }
    
    return Math.max(0, score)
  }

  /**
   * @dev Compares library definitions against contract definitions
   */
  private compareDefinitions(
    library: ContractDefinition, 
    contract: ContractDefinition
  ): IntegrityValidationResult['discrepancies'] {
    return {
      operationTypes: this.compareOperationTypes(library.operationTypes, contract.operationTypes),
      functionSchemas: this.compareFunctionSchemas(library.functionSchemas, contract.functionSchemas),
      rolePermissions: this.compareRolePermissions(library.rolePermissions, contract.rolePermissions)
    }
  }

  /**
   * @dev Compares operation types
   */
  private compareOperationTypes(
    library: OperationTypeDefinition[], 
    contract: OperationTypeDefinition[]
  ): IntegrityDiscrepancy[] {
    const discrepancies: IntegrityDiscrepancy[] = []
    
    // Check for missing operation types in contract
    for (const libOp of library) {
      const contractOp = contract.find(op => op.name === libOp.name)
      if (!contractOp) {
        discrepancies.push({
          type: 'MISSING',
          libraryValue: libOp,
          contractValue: null,
          field: 'operationType',
          severity: 'HIGH',
          description: `Operation type '${libOp.name}' is missing from contract`
        })
      }
    }
    
    // Check for extra operation types in contract
    for (const contractOp of contract) {
      const libOp = library.find(op => op.name === contractOp.name)
      if (!libOp) {
        discrepancies.push({
          type: 'EXTRA',
          libraryValue: null,
          contractValue: contractOp,
          field: 'operationType',
          severity: 'MEDIUM',
          description: `Contract has extra operation type '${contractOp.name}' not in library`
        })
      }
    }
    
    return discrepancies
  }

  /**
   * @dev Compares function schemas
   */
  private compareFunctionSchemas(
    library: FunctionSchemaDefinition[], 
    contract: FunctionSchemaDefinition[]
  ): IntegrityDiscrepancy[] {
    const discrepancies: IntegrityDiscrepancy[] = []
    
    // Check for missing function schemas in contract
    for (const libFunc of library) {
      const contractFunc = contract.find(func => func.functionSelector === libFunc.functionSelector)
      if (!contractFunc) {
        discrepancies.push({
          type: 'MISSING',
          libraryValue: libFunc,
          contractValue: null,
          field: 'functionSchema',
          severity: 'HIGH',
          description: `Function '${libFunc.functionName}' is missing from contract`
        })
      } else {
        // Check for modifications
        if (JSON.stringify(libFunc.supportedActions) !== JSON.stringify(contractFunc.supportedActions)) {
          discrepancies.push({
            type: 'MODIFIED',
            libraryValue: libFunc.supportedActions,
            contractValue: contractFunc.supportedActions,
            field: 'supportedActions',
            severity: 'CRITICAL',
            description: `Function '${libFunc.functionName}' has modified supported actions`
          })
        }
      }
    }
    
    return discrepancies
  }

  /**
   * @dev Compares role permissions
   */
  private compareRolePermissions(
    library: RolePermissionDefinition[], 
    contract: RolePermissionDefinition[]
  ): IntegrityDiscrepancy[] {
    const discrepancies: IntegrityDiscrepancy[] = []
    
    // Check for missing role permissions in contract
    for (const libRole of library) {
      const contractRole = contract.find(role => role.roleHash === libRole.roleHash)
      if (!contractRole) {
        discrepancies.push({
          type: 'MISSING',
          libraryValue: libRole,
          contractValue: null,
          field: 'rolePermission',
          severity: 'CRITICAL',
          description: `Role permission '${libRole.roleHash}' is missing from contract`
        })
      } else {
        // Check for modifications
        if (JSON.stringify(libRole.grantedActions) !== JSON.stringify(contractRole.grantedActions)) {
          discrepancies.push({
            type: 'TAMPERED',
            libraryValue: libRole.grantedActions,
            contractValue: contractRole.grantedActions,
            field: 'grantedActions',
            severity: 'CRITICAL',
            description: `Role permission '${libRole.roleHash}' has been tampered with`
          })
        }
      }
    }
    
    return discrepancies
  }

  /**
   * @dev Calculates integrity score based on discrepancies
   */
  private calculateIntegrityScore(discrepancies: IntegrityValidationResult['discrepancies']): number {
    const allDiscrepancies = [
      ...discrepancies.operationTypes,
      ...discrepancies.functionSchemas,
      ...discrepancies.rolePermissions
    ]
    
    if (allDiscrepancies.length === 0) return 100
    
    let score = 100
    for (const discrepancy of allDiscrepancies) {
      switch (discrepancy.severity) {
        case 'CRITICAL': score -= 25; break
        case 'HIGH': score -= 15; break
        case 'MEDIUM': score -= 10; break
        case 'LOW': score -= 5; break
      }
    }
    
    return Math.max(0, score)
  }

  /**
   * @dev Generates compliance violations from discrepancies
   */
  private generateViolations(discrepancies: IntegrityValidationResult['discrepancies']): ComplianceViolation[] {
    const violations: ComplianceViolation[] = []
    
    const allDiscrepancies = [
      ...discrepancies.operationTypes,
      ...discrepancies.functionSchemas,
      ...discrepancies.rolePermissions
    ]
    
    for (const discrepancy of allDiscrepancies) {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: discrepancy.severity === 'CRITICAL' ? 'HIGH' : discrepancy.severity,
        description: discrepancy.description,
        recommendation: this.getRecommendation(discrepancy)
      })
    }
    
    return violations
  }

  /**
   * @dev Gets recommendation based on discrepancy type
   */
  private getRecommendation(discrepancy: IntegrityDiscrepancy): string {
    switch (discrepancy.type) {
      case 'MISSING':
        return 'Verify contract implementation includes all required definitions'
      case 'EXTRA':
        return 'Review extra definitions to ensure they are authorized'
      case 'MODIFIED':
        return 'Investigate modifications to ensure they are intentional and secure'
      case 'TAMPERED':
        return 'CRITICAL: Contract may have been compromised - immediate investigation required'
      default:
        return 'Review contract integrity and compare with library definitions'
    }
  }

  /**
   * @dev Gets the appropriate library address for contract type
   */
  private getLibraryAddress(contractType: string): string {
    switch (contractType) {
      case 'SecureOwnable':
        return this.DEFINITION_LIBRARIES.SecureOwnableDefinitions
      case 'DynamicRBAC':
        return this.DEFINITION_LIBRARIES.DynamicRBACDefinitions
      case 'MultiPhaseSecureOperation':
        return this.DEFINITION_LIBRARIES.MultiPhaseSecureOperationDefinitions
      default:
        throw new Error(`Unknown contract type: ${contractType}`)
    }
  }
}
