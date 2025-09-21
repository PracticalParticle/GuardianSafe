// SPDX-License-Identifier: MPL-2.0
import { PublicClient, Address } from 'viem'
import { 
  DefinitionType, 
  ContractAnalysis, 
  OperationTypeDefinition,
  FunctionSchemaDefinition,
  RolePermissionDefinition,
  Workflow,
  WorkflowType,
  OperationType,
  TxAction,
  TxStatus
} from '../types/WorkflowTypes'
import { ConfigurationManager, AnalyzerConfig } from './Configuration'

/**
 * @title ContractDefinitionAnalyzer
 * @dev Analyzes Guardian contracts using their definition libraries
 * This analyzer leverages the predefined schemas in definition contracts
 * to provide accurate workflow analysis without complex ABI parsing
 */
export class ContractDefinitionAnalyzer {
  private client: PublicClient
  private config: ConfigurationManager

  constructor(client: PublicClient, config?: ConfigurationManager | AnalyzerConfig) {
    this.client = client
    this.config = config instanceof ConfigurationManager 
      ? config 
      : new ConfigurationManager(config)
  }

  /**
   * @dev Analyzes a contract using its definition library
   */
  async analyzeContract(contractAddress: Address): Promise<ContractAnalysis> {
    const analysis: ContractAnalysis = {
      contractAddress,
      definitionType: 'Generic',
      operationTypes: [],
      functionSchemas: [],
      rolePermissions: [],
      workflows: [],
      complianceScore: 0,
      analysisTimestamp: Date.now()
    }

    // Detect contract type by checking for specific functions
    const definitionType = await this.detectContractType(contractAddress)
    analysis.definitionType = definitionType

    // Analyze based on detected type
    switch (definitionType) {
      case 'SecureOwnable':
        await this.analyzeSecureOwnable(contractAddress, analysis)
        break
      case 'MultiPhaseSecureOperation':
        await this.analyzeMultiPhase(contractAddress, analysis)
        break
      case 'DynamicRBAC':
        await this.analyzeDynamicRBAC(contractAddress, analysis)
        break
      default:
        await this.analyzeGeneric(contractAddress, analysis)
    }

    // Initial compliance score (will be updated after workflow generation)
    analysis.complianceScore = this.calculateComplianceScore(analysis)

    return analysis
  }

  /**
   * @dev Calculates compliance score based on analysis results
   */
  public calculateComplianceScore(analysis: ContractAnalysis): number {
    let score = 0

    // Base score for having operation types
    if (analysis.operationTypes.length > 0) {
      score += 20
    }

    // Score for function schemas
    if (analysis.functionSchemas.length > 0) {
      score += 20
    }

    // Score for role permissions
    if (analysis.rolePermissions.length > 0) {
      score += 20
    }

    // Bonus for using definition libraries
    switch (analysis.definitionType) {
      case 'SecureOwnable':
      case 'MultiPhaseSecureOperation':
      case 'DynamicRBAC':
        score += 30 // Bonus for using Guardian framework
        break
      case 'Generic':
        score += 10 // Small bonus for generic contracts
        break
    }

    // Bonus for having workflows (will be calculated later)
    if (analysis.workflows.length > 0) {
      score += 10
    }

    return Math.min(100, score)
  }

  /**
   * @dev Detects contract type by checking for specific functions
   */
  private async detectContractType(contractAddress: Address): Promise<DefinitionType> {
    try {
      // Check for Guardian contracts by looking for getSupportedOperationTypes
      const hasSupportedOps = await this.hasFunction(contractAddress, 'getSupportedOperationTypes')
      if (hasSupportedOps) {
        // Check for DynamicRBAC functions
        const hasRoleEditing = await this.hasFunction(contractAddress, 'updateRoleEditingToggleRequestAndApprove')
        if (hasRoleEditing) {
          return 'DynamicRBAC'
        }
        
        // Check for SecureOwnable functions
        const hasTransferOwnership = await this.hasFunction(contractAddress, 'transferOwnershipRequest')
        if (hasTransferOwnership) {
          return 'SecureOwnable'
        }
        
        // If it has supported operations but no specific functions, try to determine type
        // by checking if it has Guardian-specific functions
        const hasGuardianFunctions = await this.hasGuardianSpecificFunctions(contractAddress)
        if (hasGuardianFunctions.isSecureOwnable) {
          return 'SecureOwnable'
        } else if (hasGuardianFunctions.isDynamicRBAC) {
          return 'DynamicRBAC'
        } else if (hasGuardianFunctions.isMultiPhase) {
          return 'MultiPhaseSecureOperation'
        }
      }

      // Check for MultiPhase functions
      const hasTxRequest = await this.hasFunction(contractAddress, 'txRequest')
      if (hasTxRequest) {
        return 'MultiPhaseSecureOperation'
      }

      return 'Generic'
    } catch (error) {
      console.warn(`Error detecting contract type for ${contractAddress}:`, error)
      return 'Generic'
    }
  }

  /**
   * @dev Checks if contract has a specific function by actually calling it
   */
  private async hasFunction(contractAddress: Address, functionName: string): Promise<boolean> {
    try {
      // Try to call the function to see if it exists
      await this.client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: functionName,
          outputs: [{ name: '', type: 'bytes' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: functionName
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * @dev Checks for Guardian-specific functions to determine contract type
   */
  private async hasGuardianSpecificFunctions(contractAddress: Address): Promise<{
    isSecureOwnable: boolean
    isDynamicRBAC: boolean
    isMultiPhase: boolean
  }> {
    const functions = [
      'transferOwnershipRequest',
      'updateRoleEditingToggleRequestAndApprove', 
      'txRequest',
      'getBroadcaster',
      'getRecovery',
      'timeLockPeriod'
    ]

    const results = await Promise.all(
      functions.map(func => this.hasFunction(contractAddress, func))
    )

    const [
      hasTransferOwnership,
      hasRoleEditing,
      hasTxRequest,
      hasBroadcaster,
      hasRecovery,
      hasTimeLock
    ] = results

    return {
      isSecureOwnable: hasTransferOwnership || (hasBroadcaster && hasRecovery),
      isDynamicRBAC: hasRoleEditing,
      isMultiPhase: hasTxRequest || hasTimeLock
    }
  }

  /**
   * @dev Analyzes SecureOwnable contracts by calling deployed definition libraries
   */
  private async analyzeSecureOwnable(contractAddress: Address, analysis: ContractAnalysis): Promise<void> {
    try {
      // Call SecureOwnableDefinitions library to get operation types
      const operationTypes = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('SecureOwnableDefinitions'),
        abi: [{
          inputs: [],
          name: 'getOperationTypes',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'operationType', type: 'bytes32' },
            { name: 'name', type: 'string' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getOperationTypes'
      }) as OperationTypeDefinition[]

      analysis.operationTypes = operationTypes || []

      // Call SecureOwnableDefinitions library to get function schemas
      const functionSchemas = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('SecureOwnableDefinitions'),
        abi: [{
          inputs: [],
          name: 'getFunctionSchemas',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'functionName', type: 'string' },
            { name: 'functionSelector', type: 'bytes4' },
            { name: 'operationType', type: 'bytes32' },
            { name: 'supportedActions', type: 'uint8[]' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getFunctionSchemas'
      }) as FunctionSchemaDefinition[]

      analysis.functionSchemas = functionSchemas || []

      // Call SecureOwnableDefinitions library to get function permissions
      const rolePermissions = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('SecureOwnableDefinitions'),
        abi: [{
          inputs: [],
          name: 'getFunctionPermissions',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'functionSelector', type: 'bytes4' },
            { name: 'grantedActions', type: 'uint8[]' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getFunctionPermissions'
      }) as any[]

      analysis.rolePermissions = rolePermissions || []

    } catch (error) {
      console.warn(`Error analyzing SecureOwnable contract ${contractAddress}:`, error)
      // Fallback to empty analysis
      analysis.operationTypes = []
      analysis.functionSchemas = []
      analysis.rolePermissions = []
    }
  }

  /**
   * @dev Analyzes MultiPhaseSecureOperation contracts by calling deployed definition libraries
   */
  private async analyzeMultiPhase(contractAddress: Address, analysis: ContractAnalysis): Promise<void> {
    try {
      // Call MultiPhaseSecureOperationDefinitions library
      const operationTypes = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('MultiPhaseSecureOperationDefinitions'),
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
      }) as OperationTypeDefinition[]

      analysis.operationTypes = operationTypes || []

      const functionSchemas = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('MultiPhaseSecureOperationDefinitions'),
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
      }) as FunctionSchemaDefinition[]

      analysis.functionSchemas = functionSchemas || []

      const rolePermissions = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('MultiPhaseSecureOperationDefinitions'),
        abi: [{
          inputs: [],
          name: 'getRolePermissions',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'roleHash', type: 'string' },
            { name: 'functionSelector', type: 'string' },
            { name: 'grantedActions', type: 'uint8[]' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getRolePermissions'
      }) as RolePermissionDefinition[]

      analysis.rolePermissions = rolePermissions || []

    } catch (error) {
      console.warn(`Error analyzing MultiPhase contract ${contractAddress}:`, error)
      analysis.operationTypes = []
      analysis.functionSchemas = []
      analysis.rolePermissions = []
    }
  }

  /**
   * @dev Analyzes DynamicRBAC contracts by calling deployed definition libraries
   */
  private async analyzeDynamicRBAC(contractAddress: Address, analysis: ContractAnalysis): Promise<void> {
    try {
      // Call DynamicRBACDefinitions library
      const operationTypes = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('DynamicRBACDefinitions'),
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
      }) as OperationTypeDefinition[]

      analysis.operationTypes = operationTypes || []

      const functionSchemas = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('DynamicRBACDefinitions'),
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
      }) as FunctionSchemaDefinition[]

      analysis.functionSchemas = functionSchemas || []

      const rolePermissions = await this.client.readContract({
        address: this.config.getDefinitionLibraryAddress('DynamicRBACDefinitions'),
        abi: [{
          inputs: [],
          name: 'getRolePermissions',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'roleHash', type: 'string' },
            { name: 'functionSelector', type: 'string' },
            { name: 'grantedActions', type: 'uint8[]' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getRolePermissions'
      }) as RolePermissionDefinition[]

      analysis.rolePermissions = rolePermissions || []

    } catch (error) {
      console.warn(`Error analyzing DynamicRBAC contract ${contractAddress}:`, error)
      analysis.operationTypes = []
      analysis.functionSchemas = []
      analysis.rolePermissions = []
    }
  }

  /**
   * @dev Analyzes generic contracts (fallback)
   */
  private async analyzeGeneric(contractAddress: Address, analysis: ContractAnalysis): Promise<void> {
    // For generic contracts, we can't provide specific analysis
    // This would require ABI parsing which is complex
    analysis.operationTypes = []
    analysis.functionSchemas = []
    analysis.rolePermissions = []
  }

  /**
   * @dev Generates workflows from contract analysis
   */
  generateWorkflows(analysis: ContractAnalysis): Workflow[] {
    const workflows: Workflow[] = []

    // Group functions by operation type
    const functionsByOperation = new Map<string, FunctionSchemaDefinition[]>()
    
    for (const schema of analysis.functionSchemas) {
      if (!functionsByOperation.has(schema.operationType)) {
        functionsByOperation.set(schema.operationType, [])
      }
      functionsByOperation.get(schema.operationType)!.push(schema)
    }

    // Generate workflows for each operation type
    for (const [operationType, functions] of functionsByOperation) {
      const workflow = this.generateWorkflowForOperation(analysis, operationType, functions)
      if (workflow) {
        workflows.push(workflow)
      }
    }

    return workflows
  }

  /**
   * @dev Generates a workflow for a specific operation type
   */
  private generateWorkflowForOperation(
    analysis: ContractAnalysis, 
    operationType: string, 
    functions: FunctionSchemaDefinition[]
  ): Workflow | null {
    if (functions.length === 0) return null

    // Convert FunctionSchemaDefinition to FunctionSchema
    const convertedFunctions = functions.map(f => ({
      name: f.functionName,
      selector: f.functionSelector,
      operationType: f.operationType as OperationType,
      supportedActions: f.supportedActions.map(actionIndex => this.getActionFromIndex(actionIndex)),
      parameters: [] // Would need to parse from ABI
    }))

    // Get roles for this operation
    const roles = analysis.rolePermissions
      .filter(role => functions.some(f => f.functionSelector === role.functionSelector))
      .map(role => ({
        roleHash: role.roleHash,
        roleName: this.getRoleNameFromHash(role.roleHash),
        functionSelector: role.functionSelector,
        grantedActions: role.grantedActions.map(actionIndex => this.getActionFromIndex(actionIndex))
      }))

    // Determine workflow type based on actions
    const allActions = convertedFunctions.flatMap(f => f.supportedActions)
    const workflowType = this.determineWorkflowType(allActions)

    // Create operations
    const operations = [{
      id: `${operationType.toLowerCase()}-op`,
      type: operationType as OperationType,
      functions: convertedFunctions,
      roles: roles,
      requiredActions: allActions,
      stateTransitions: this.generateStateTransitions(workflowType)
    }]

    return {
      id: `${operationType.toLowerCase()}-workflow`,
      name: `${operationType} Workflow`,
      type: workflowType,
      contractAddress: analysis.contractAddress,
      operations: operations,
      stateTransitions: this.generateStateTransitions(workflowType),
      isValid: true,
      validationErrors: []
    }
  }

  /**
   * @dev Determines workflow type based on actions
   */
  private determineWorkflowType(actions: TxAction[]): WorkflowType {
    const hasTimeDelayRequest = actions.includes('EXECUTE_TIME_DELAY_REQUEST')
    const hasTimeDelayApprove = actions.includes('EXECUTE_TIME_DELAY_APPROVE')
    const hasMetaTxApprove = actions.includes('EXECUTE_META_APPROVE')
    const hasMetaTxRequestAndApprove = actions.includes('EXECUTE_META_REQUEST_AND_APPROVE')

    if (hasTimeDelayRequest && hasTimeDelayApprove && !hasMetaTxApprove && !hasMetaTxRequestAndApprove) {
      return 'TIME_DELAY_ONLY'
    } else if (hasMetaTxRequestAndApprove && !hasTimeDelayRequest && !hasTimeDelayApprove) {
      return 'META_TX_ONLY'
    } else if ((hasTimeDelayRequest && hasMetaTxApprove) || 
               (hasTimeDelayRequest && hasTimeDelayApprove && hasMetaTxRequestAndApprove)) {
      return 'HYBRID'
    } else {
      return 'BROKEN'
    }
  }

  /**
   * @dev Generates state transitions for workflow type
   */
  private generateStateTransitions(workflowType: WorkflowType): Array<{from: TxStatus, to: TxStatus, conditions: string[], requiredActions: TxAction[]}> {
    const baseTransitions = [
      { 
        from: 'UNDEFINED' as TxStatus, 
        to: 'PENDING' as TxStatus,
        conditions: ['Request submitted'],
        requiredActions: ['EXECUTE_TIME_DELAY_REQUEST'] as TxAction[]
      },
      { 
        from: 'PENDING' as TxStatus, 
        to: 'COMPLETED' as TxStatus,
        conditions: ['Time delay passed', 'Approval provided'],
        requiredActions: ['EXECUTE_TIME_DELAY_APPROVE'] as TxAction[]
      },
      { 
        from: 'PENDING' as TxStatus, 
        to: 'CANCELLED' as TxStatus,
        conditions: ['Cancellation requested'],
        requiredActions: ['EXECUTE_TIME_DELAY_CANCEL'] as TxAction[]
      }
    ]

    switch (workflowType) {
      case 'TIME_DELAY_ONLY':
        return baseTransitions
      case 'META_TX_ONLY':
        return [{ 
          from: 'UNDEFINED', 
          to: 'COMPLETED',
          conditions: ['Meta-transaction executed'],
          requiredActions: ['EXECUTE_META_REQUEST_AND_APPROVE'] as TxAction[]
        }]
      case 'HYBRID':
        return [
          ...baseTransitions,
          {
            from: 'PENDING' as TxStatus,
            to: 'COMPLETED' as TxStatus,
            conditions: ['Meta-transaction approval'],
            requiredActions: ['EXECUTE_META_APPROVE'] as TxAction[]
          }
        ]
      case 'BROKEN':
        return []
      default:
        return baseTransitions
    }
  }

  /**
   * @dev Gets action from index
   */
  private getActionFromIndex(index: number): TxAction {
    const actionMap: Record<number, TxAction> = {
      0: 'EXECUTE_TIME_DELAY_REQUEST',
      1: 'EXECUTE_TIME_DELAY_APPROVE',
      2: 'EXECUTE_TIME_DELAY_CANCEL',
      3: 'SIGN_META_APPROVE',
      4: 'EXECUTE_META_APPROVE',
      5: 'SIGN_META_CANCEL',
      6: 'EXECUTE_META_CANCEL',
      7: 'SIGN_META_REQUEST_AND_APPROVE',
      8: 'EXECUTE_META_REQUEST_AND_APPROVE'
    }
    return actionMap[index] ?? 'EXECUTE_TIME_DELAY_REQUEST'
  }

  /**
   * @dev Gets role name from hash
   */
  private getRoleNameFromHash(roleHash: string): string {
    if (roleHash.includes('OWNER_ROLE')) return 'OWNER_ROLE'
    if (roleHash.includes('BROADCASTER_ROLE')) return 'BROADCASTER_ROLE'
    if (roleHash.includes('RECOVERY_ROLE')) return 'RECOVERY_ROLE'
    return 'CUSTOM_ROLE'
  }
}