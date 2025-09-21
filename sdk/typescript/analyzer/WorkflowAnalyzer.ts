// SPDX-License-Identifier: MPL-2.0
import { PublicClient, Address } from 'viem'
import { ContractDefinitionAnalyzer } from './ContractDefinitionAnalyzer'
import { WorkflowValidator } from './WorkflowValidator'
import { ContractIntegrityValidator } from './ContractIntegrityValidator'
import { ContractInitializationValidator } from './ContractInitializationValidator'
import { ConfigurationManager, AnalyzerConfig } from './Configuration'
import { 
  ContractAnalysis, 
  Workflow, 
  ValidationResult, 
  WorkflowType,
  DefinitionType,
  ComplianceResult,
  WorkflowStatistics
} from '../types/WorkflowTypes'

/**
 * @title WorkflowAnalyzer
 * @dev Main analyzer class that orchestrates workflow analysis
 * Combines contract analysis, workflow generation, and validation
 */
export class WorkflowAnalyzer {
  private contractAnalyzer: ContractDefinitionAnalyzer
  private workflowValidator: WorkflowValidator
  private integrityValidator: ContractIntegrityValidator
  private initializationValidator: ContractInitializationValidator
  private config: ConfigurationManager

  constructor(client: PublicClient, config?: ConfigurationManager | AnalyzerConfig) {
    this.config = config instanceof ConfigurationManager 
      ? config 
      : new ConfigurationManager(config)
    this.contractAnalyzer = new ContractDefinitionAnalyzer(client, this.config)
    this.workflowValidator = new WorkflowValidator()
    this.integrityValidator = new ContractIntegrityValidator(client)
    this.initializationValidator = new ContractInitializationValidator(client)
  }

  /**
   * @dev Analyzes a contract and generates validated workflows
   * @param contractAddress The address of the contract to analyze
   * @return Complete analysis with validated workflows
   */
  async analyzeContract(contractAddress: Address): Promise<ContractAnalysis> {
    console.log(`🔍 Analyzing contract: ${contractAddress}`)
    
    // Step 1: Analyze contract using definition libraries
    const analysis = await this.contractAnalyzer.analyzeContract(contractAddress)
    
    // Step 1.5: Generate workflows from analysis
    const workflows = this.contractAnalyzer.generateWorkflows(analysis)
    analysis.workflows = workflows
    
    // Update compliance score after workflow generation
    analysis.complianceScore = this.contractAnalyzer.calculateComplianceScore(analysis)
    
    console.log(`📋 Detected definition type: ${analysis.definitionType}`)
    console.log(`📊 Found ${analysis.operationTypes.length} operation types`)
    console.log(`🔧 Found ${analysis.functionSchemas.length} function schemas`)
    console.log(`👥 Found ${analysis.rolePermissions.length} role permissions`)
    console.log(`🔄 Generated ${analysis.workflows.length} workflows`)

    // Step 2: Validate all workflows
    const validatedWorkflows: Workflow[] = []
    for (const workflow of analysis.workflows) {
      const validation = this.validateWorkflow(workflow, analysis.definitionType)
      
      // Update workflow with validation results
      workflow.isValid = validation.isValid
      workflow.validationErrors = validation.errors
      
      validatedWorkflows.push(workflow)
      
      console.log(`✅ Workflow "${workflow.name}" validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`)
      if (!validation.isValid) {
        console.log(`❌ Validation errors: ${validation.errors.join(', ')}`)
      }
    }

    // Update analysis with validated workflows
    analysis.workflows = validatedWorkflows

    // Step 3: Perform initialization validation
    const initializationResult = await this.validateContractInitialization(contractAddress, analysis.definitionType)
    
    // Step 4: Calculate final compliance score
    analysis.complianceScore = this.calculateFinalComplianceScore(analysis)

    console.log(`🎯 Final compliance score: ${analysis.complianceScore.toFixed(1)}%`)
    
    return analysis
  }

  /**
   * @dev Validates a single workflow
   * @param workflow The workflow to validate
   * @param definitionType The definition type for context
   * @return Validation result
   */
  validateWorkflow(workflow: Workflow, definitionType: DefinitionType): ValidationResult {
    return this.workflowValidator.validateWorkflow(workflow, definitionType)
  }

  /**
   * @dev Classifies a workflow type
   * @param workflow The workflow to classify
   * @return The classified workflow type
   */
  classifyWorkflow(workflow: Workflow): WorkflowType {
    return this.workflowValidator.classifyWorkflow(workflow)
  }

  /**
   * @dev Generates workflows for a contract
   * @param contractAddress The contract address
   * @return Array of generated workflows
   */
  async generateWorkflows(contractAddress: Address): Promise<Workflow[]> {
    const analysis = await this.contractAnalyzer.analyzeContract(contractAddress)
    const workflows = this.contractAnalyzer.generateWorkflows(analysis)
    return workflows
  }

  /**
   * @dev Validates workflow sequences
   * @param workflows Array of workflows to validate
   * @return Validation results for all workflows
   */
  validateWorkflowSequences(workflows: Workflow[]): ValidationResult[] {
    return workflows.map(workflow => 
      this.workflowValidator.validateWorkflow(workflow, 'Generic')
    )
  }

  /**
   * @dev Checks protocol compliance
   * @param contractAddress The contract address to check
   * @return Compliance result
   */
  async checkProtocolCompliance(contractAddress: Address): Promise<ComplianceResult> {
    const analysis = await this.analyzeContract(contractAddress)
    
    const violations = []
    const recommendations = []

    // Check definition type compliance
    if (analysis.definitionType === 'Generic') {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: 'HIGH',
        description: 'Contract does not use Guardian definition libraries',
        recommendation: 'Implement SecureOwnable, MultiPhaseSecureOperation, or DynamicRBAC definitions'
      })
    }

    // Check operation types
    if (analysis.operationTypes.length === 0) {
      violations.push({
        type: 'MISSING_FUNCTION',
        severity: 'HIGH',
        description: 'No operation types defined',
        recommendation: 'Define operation types using definition libraries'
      })
    }

    // Check function schemas
    if (analysis.functionSchemas.length === 0) {
      violations.push({
        type: 'MISSING_FUNCTION',
        severity: 'HIGH',
        description: 'No function schemas defined',
        recommendation: 'Define function schemas using definition libraries'
      })
    }

    // Check role permissions
    if (analysis.rolePermissions.length === 0) {
      violations.push({
        type: 'INVALID_ROLE',
        severity: 'MEDIUM',
        description: 'No role permissions defined',
        recommendation: 'Define role permissions using definition libraries'
      })
    }

    // Check workflow validity
    const invalidWorkflows = analysis.workflows.filter(w => !w.isValid)
    if (invalidWorkflows.length > 0) {
      violations.push({
        type: 'PROTOCOL_VIOLATION',
        severity: 'HIGH',
        description: `${invalidWorkflows.length} invalid workflows detected`,
        recommendation: 'Fix workflow validation errors'
      })
    }

    // Generate recommendations
    if (analysis.complianceScore < 80) {
      recommendations.push('Improve contract compliance by implementing proper definition libraries')
    }

    if (analysis.workflows.length === 0) {
      recommendations.push('Generate workflows for better protocol integration')
    }

    const highSeverityViolations = violations.filter(v => v.severity === 'HIGH').length
    const mediumSeverityViolations = violations.filter(v => v.severity === 'MEDIUM').length
    const lowSeverityViolations = violations.filter(v => v.severity === 'LOW').length

    const score = Math.max(0, 100 - (highSeverityViolations * 20 + mediumSeverityViolations * 10 + lowSeverityViolations * 5))

    return {
      isCompliant: violations.length === 0,
      score,
      violations,
      recommendations
    }
  }

  /**
   * @dev Detects broken workflows
   * @param workflows Array of workflows to check
   * @return Array of broken workflows
   */
  detectBrokenWorkflows(workflows: Workflow[]): Workflow[] {
    return workflows.filter(workflow => {
      const validation = this.workflowValidator.validateWorkflow(workflow, 'Generic')
      return !validation.isValid || this.workflowValidator.classifyWorkflow(workflow) === 'BROKEN'
    })
  }

  /**
   * @dev Analyzes workflow statistics
   * @param workflows Array of workflows to analyze
   * @return Statistics about the workflows
   */
  analyzeWorkflowStatistics(workflows: Workflow[]): WorkflowStatistics {
    const totalWorkflows = workflows.length
    const validWorkflows = workflows.filter(w => w.isValid).length
    const brokenWorkflows = workflows.filter(w => !w.isValid).length

    const workflowTypes = workflows.reduce((acc, workflow) => {
      const type = this.workflowValidator.classifyWorkflow(workflow)
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<WorkflowType, number>)

    const totalOperations = workflows.reduce((sum, workflow) => sum + workflow.operations.length, 0)
    const totalStateTransitions = workflows.reduce((sum, workflow) => sum + workflow.stateTransitions.length, 0)

    return {
      totalWorkflows,
      validWorkflows,
      brokenWorkflows,
      workflowTypes,
      totalOperations,
      totalStateTransitions,
      averageOperationsPerWorkflow: totalWorkflows > 0 ? totalOperations / totalWorkflows : 0,
      averageStateTransitionsPerWorkflow: totalWorkflows > 0 ? totalStateTransitions / totalWorkflows : 0
    }
  }

  /**
   * @dev Calculates final compliance score
   */
  private calculateFinalComplianceScore(analysis: ContractAnalysis): number {
    let score = analysis.complianceScore

    // Adjust score based on workflow validity
    const validWorkflows = analysis.workflows.filter(w => w.isValid).length
    const totalWorkflows = analysis.workflows.length
    
    if (totalWorkflows > 0) {
      const workflowValidityScore = (validWorkflows / totalWorkflows) * 100
      score = (score + workflowValidityScore) / 2
    }

    // Adjust score based on definition type
    switch (analysis.definitionType) {
      case 'SecureOwnable':
      case 'MultiPhaseSecureOperation':
      case 'DynamicRBAC':
        score = Math.min(100, score + 10) // Bonus for using definition libraries
        break
      case 'Generic':
        score = Math.max(0, score - 20) // Penalty for generic contracts
        break
    }

    return Math.round(score * 10) / 10 // Round to 1 decimal place
  }

  /**
   * @dev Validates contract initialization status
   * @param contractAddress The contract address to validate
   * @param contractType The type of contract
   * @return Initialization validation result
   */
  async validateContractInitialization(contractAddress: Address, contractType: DefinitionType) {
    console.log(`🚀 Validating contract initialization: ${contractAddress}`)
    
    const initializationResult = await this.initializationValidator.validateInitialization(
      contractAddress,
      contractType as any // Type assertion for compatibility
    )
    
    console.log(`✅ Initialization validation complete. Score: ${initializationResult.score}%`)
    
    if (!initializationResult.isValid) {
      console.warn(`⚠️ Contract initialization issues detected:`)
      initializationResult.violations.forEach(violation => {
        console.warn(`   - ${violation.severity}: ${violation.description}`)
      })
    }
    
    if (initializationResult.status.warnings.length > 0) {
      console.warn(`⚠️ Initialization warnings:`)
      initializationResult.status.warnings.forEach(warning => {
        console.warn(`   - ${warning}`)
      })
    }
    
    return initializationResult
  }

  /**
   * @dev Validates contract integrity by comparing against definition libraries
   * @param contractAddress The address of the contract to validate
   * @return Integrity validation result with security analysis
   */
  async validateContractIntegrity(contractAddress: Address) {
    console.log(`🛡️ Validating contract integrity: ${contractAddress}`)
    
    // First get the contract type
    const analysis = await this.contractAnalyzer.analyzeContract(contractAddress)
    
    // Perform integrity validation
    const integrityResult = await this.integrityValidator.validateContractIntegrity(
      contractAddress, 
      analysis.definitionType as 'SecureOwnable' | 'DynamicRBAC' | 'MultiPhaseSecureOperation'
    )
    
    console.log(`✅ Integrity validation complete. Score: ${integrityResult.score}%`)
    
    if (!integrityResult.isValid) {
      console.warn(`⚠️ Contract integrity issues detected:`)
      integrityResult.violations.forEach(violation => {
        console.warn(`   - ${violation.severity}: ${violation.description}`)
      })
    }
    
    return integrityResult
  }
}

