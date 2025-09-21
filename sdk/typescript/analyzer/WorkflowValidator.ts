// SPDX-License-Identifier: MPL-2.0
import { 
  Workflow, 
  ValidationResult, 
  OperationType, 
  TxAction, 
  TxStatus,
  WorkflowType,
  DefinitionType
} from '../types/WorkflowTypes'

/**
 * @title WorkflowValidator
 * @dev Validates workflows against Guardian protocol standards
 * Ensures workflows follow proper state transitions and action sequences
 */
export class WorkflowValidator {
  
  /**
   * @dev Validates a workflow against protocol standards
   * @param workflow The workflow to validate
   * @param definitionType The type of definition library used
   * @return Validation result with errors and warnings
   */
  validateWorkflow(workflow: Workflow, definitionType: DefinitionType): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    let score = 100

    // Validate workflow structure
    this.validateWorkflowStructure(workflow, errors, warnings)
    score -= errors.length * 10
    score -= warnings.length * 5

    // Validate state transitions
    this.validateStateTransitions(workflow, errors, warnings)
    score -= errors.length * 10
    score -= warnings.length * 5

    // Validate action sequences
    this.validateActionSequences(workflow, errors, warnings)
    score -= errors.length * 10
    score -= warnings.length * 5

    // Validate against definition type standards
    this.validateAgainstDefinitionType(workflow, definitionType, errors, warnings)
    score -= errors.length * 10
    score -= warnings.length * 5

    // Ensure score doesn't go below 0
    score = Math.max(0, score)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    }
  }

  /**
   * @dev Validates workflow structure
   */
  private validateWorkflowStructure(workflow: Workflow, errors: string[], warnings: string[]): void {
    // Check required fields
    if (!workflow.id) {
      errors.push('Workflow must have an ID')
    }

    if (!workflow.name) {
      errors.push('Workflow must have a name')
    }

    if (!workflow.type) {
      errors.push('Workflow must have a type')
    }

    if (!workflow.contractAddress) {
      errors.push('Workflow must have a contract address')
    }

    if (!workflow.operations || workflow.operations.length === 0) {
      errors.push('Workflow must have at least one operation')
    }

    if (!workflow.stateTransitions || workflow.stateTransitions.length === 0) {
      warnings.push('Workflow should have defined state transitions')
    }
  }

  /**
   * @dev Validates state transitions
   */
  private validateStateTransitions(workflow: Workflow, errors: string[], warnings: string[]): void {
    if (!workflow.stateTransitions || workflow.stateTransitions.length === 0) {
      return
    }

    const validTransitions = this.getValidStateTransitions(workflow.type)

    for (const transition of workflow.stateTransitions) {
      // Check if transition is valid for workflow type
      const isValidTransition = validTransitions.some(valid => 
        valid.from === transition.from && valid.to === transition.to
      )

      if (!isValidTransition) {
        errors.push(`Invalid state transition: ${transition.from} → ${transition.to} for workflow type ${workflow.type}`)
      }

      // Check required actions
      if (!transition.requiredActions || transition.requiredActions.length === 0) {
        warnings.push(`State transition ${transition.from} → ${transition.to} should specify required actions`)
      }

      // Check conditions
      if (!transition.conditions || transition.conditions.length === 0) {
        warnings.push(`State transition ${transition.from} → ${transition.to} should specify conditions`)
      }
    }

    // Check for proper workflow flow
    this.validateWorkflowFlow(workflow, errors, warnings)
  }

  /**
   * @dev Validates action sequences
   */
  private validateActionSequences(workflow: Workflow, errors: string[], warnings: string[]): void {
    for (const operation of workflow.operations) {
      // Check if operation has required actions
      if (!operation.requiredActions || operation.requiredActions.length === 0) {
        warnings.push(`Operation ${operation.type} should specify required actions`)
      }

      // Check if operation has functions
      if (!operation.functions || operation.functions.length === 0) {
        errors.push(`Operation ${operation.type} must have at least one function`)
      }

      // Check if operation has roles
      if (!operation.roles || operation.roles.length === 0) {
        warnings.push(`Operation ${operation.type} should specify required roles`)
      }

      // Validate action consistency
      this.validateActionConsistency(operation, errors, warnings)
    }
  }

  /**
   * @dev Validates against definition type standards
   */
  private validateAgainstDefinitionType(
    workflow: Workflow, 
    definitionType: DefinitionType, 
    errors: string[], 
    warnings: string[]
  ): void {
    switch (definitionType) {
      case 'SecureOwnable':
        this.validateSecureOwnableWorkflow(workflow, errors, warnings)
        break
      case 'MultiPhaseSecureOperation':
        this.validateMultiPhaseWorkflow(workflow, errors, warnings)
        break
      case 'DynamicRBAC':
        this.validateDynamicRBACWorkflow(workflow, errors, warnings)
        break
      case 'Generic':
        // Generic workflows have fewer constraints
        break
    }
  }

  /**
   * @dev Validates SecureOwnable specific workflows
   */
  private validateSecureOwnableWorkflow(workflow: Workflow, errors: string[], warnings: string[]): void {
    const validOperations: OperationType[] = [
      'OWNERSHIP_TRANSFER',
      'BROADCASTER_UPDATE',
      'RECOVERY_UPDATE',
      'TIMELOCK_UPDATE'
    ]

    for (const operation of workflow.operations) {
      if (!validOperations.includes(operation.type)) {
        errors.push(`Invalid operation type ${operation.type} for SecureOwnable workflow`)
      }

      // Check for proper role assignments
      if (operation.type === 'OWNERSHIP_TRANSFER') {
        const hasOwnerRole = operation.roles.some(role => role.roleName === 'OWNER_ROLE')
        const hasRecoveryRole = operation.roles.some(role => role.roleName === 'RECOVERY_ROLE')
        
        if (!hasOwnerRole && !hasRecoveryRole) {
          errors.push('Ownership transfer operation must have OWNER_ROLE or RECOVERY_ROLE')
        }
      }
    }
  }

  /**
   * @dev Validates MultiPhase specific workflows
   */
  private validateMultiPhaseWorkflow(workflow: Workflow, errors: string[], warnings: string[]): void {
    const validOperations: OperationType[] = ['SYSTEM_OPERATION']

    for (const operation of workflow.operations) {
      if (!validOperations.includes(operation.type)) {
        errors.push(`Invalid operation type ${operation.type} for MultiPhase workflow`)
      }

      // Check for proper action sequences
      const hasTimeDelayActions = operation.requiredActions.some(action => 
        action.includes('TIME_DELAY')
      )
      const hasMetaTxActions = operation.requiredActions.some(action => 
        action.includes('META')
      )

      if (!hasTimeDelayActions && !hasMetaTxActions) {
        errors.push('MultiPhase operation must have time-delay or meta-transaction actions')
      }
    }
  }

  /**
   * @dev Validates DynamicRBAC specific workflows
   */
  private validateDynamicRBACWorkflow(workflow: Workflow, errors: string[], warnings: string[]): void {
    const validOperations: OperationType[] = ['ROLE_EDITING_TOGGLE']

    for (const operation of workflow.operations) {
      if (!validOperations.includes(operation.type)) {
        errors.push(`Invalid operation type ${operation.type} for DynamicRBAC workflow`)
      }

      // Check for broadcaster role requirement
      const hasBroadcasterRole = operation.roles.some(role => role.roleName === 'BROADCASTER_ROLE')
      if (!hasBroadcasterRole) {
        errors.push('DynamicRBAC operation must have BROADCASTER_ROLE')
      }
    }
  }

  /**
   * @dev Validates workflow flow
   */
  private validateWorkflowFlow(workflow: Workflow, errors: string[], warnings: string[]): void {
    if (!workflow.stateTransitions || workflow.stateTransitions.length === 0) {
      return
    }

    // Check for proper start state
    const hasStartState = workflow.stateTransitions.some(transition => 
      transition.from === 'UNDEFINED'
    )
    if (!hasStartState) {
      warnings.push('Workflow should start from UNDEFINED state')
    }

    // Check for proper end states
    const hasEndState = workflow.stateTransitions.some(transition => 
      transition.to === 'COMPLETED' || transition.to === 'CANCELLED'
    )
    if (!hasEndState) {
      warnings.push('Workflow should have COMPLETED or CANCELLED end states')
    }

    // Check for cycles
    this.validateNoCycles(workflow, errors, warnings)
  }

  /**
   * @dev Validates no cycles in state transitions
   */
  private validateNoCycles(workflow: Workflow, errors: string[], warnings: string[]): void {
    const transitions = workflow.stateTransitions
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (state: TxStatus): boolean => {
      if (recursionStack.has(state)) {
        return true
      }
      if (visited.has(state)) {
        return false
      }

      visited.add(state)
      recursionStack.add(state)

      const outgoingTransitions = transitions.filter(t => t.from === state)
      for (const transition of outgoingTransitions) {
        if (hasCycle(transition.to)) {
          return true
        }
      }

      recursionStack.delete(state)
      return false
    }

    for (const transition of transitions) {
      if (hasCycle(transition.from)) {
        errors.push('Workflow contains cycles in state transitions')
        break
      }
    }
  }

  /**
   * @dev Validates action consistency
   */
  private validateActionConsistency(operation: any, errors: string[], warnings: string[]): void {
    // Check if required actions match function capabilities
    for (const function_ of operation.functions) {
      const functionActions = function_.supportedActions || []
      const requiredActions = operation.requiredActions || []

      for (const requiredAction of requiredActions) {
        const actionIndex = this.getActionIndex(requiredAction)
        if (actionIndex !== -1 && !functionActions.includes(actionIndex)) {
          warnings.push(`Function ${function_.name} doesn't support required action ${requiredAction}`)
        }
      }
    }
  }

  /**
   * @dev Gets valid state transitions for workflow type
   */
  private getValidStateTransitions(workflowType: WorkflowType): Array<{from: TxStatus, to: TxStatus}> {
    const baseTransitions = [
      { from: 'UNDEFINED' as TxStatus, to: 'PENDING' as TxStatus },
      { from: 'PENDING' as TxStatus, to: 'COMPLETED' as TxStatus },
      { from: 'PENDING' as TxStatus, to: 'CANCELLED' as TxStatus }
    ]

    switch (workflowType) {
      case 'TIME_DELAY_ONLY':
        return baseTransitions  // REQUEST → APPROVE (both time-delay)
      case 'META_TX_ONLY':
        return [
          { from: 'UNDEFINED', to: 'COMPLETED' }  // Single meta-tx: REQUEST_AND_APPROVE
        ]
      case 'HYBRID':
        return baseTransitions  // REQUEST (time-delay) → APPROVE (meta-tx) OR both options
      case 'BROKEN':
        return [] // No valid transitions for broken workflows
      default:
        return baseTransitions
    }
  }

  /**
   * @dev Gets action index for validation
   */
  private getActionIndex(action: TxAction): number {
    const actionMap: Record<TxAction, number> = {
      'EXECUTE_TIME_DELAY_REQUEST': 0,
      'EXECUTE_TIME_DELAY_APPROVE': 1,
      'EXECUTE_TIME_DELAY_CANCEL': 2,
      'SIGN_META_APPROVE': 3,
      'EXECUTE_META_APPROVE': 4,
      'SIGN_META_CANCEL': 5,
      'EXECUTE_META_CANCEL': 6,
      'SIGN_META_REQUEST_AND_APPROVE': 7,
      'EXECUTE_META_REQUEST_AND_APPROVE': 8
    }
    return actionMap[action] ?? -1
  }

  /**
   * @dev Classifies workflow type based on actions
   * Corrected logic based on proper meta-transaction understanding:
   * - TIME_DELAY_ONLY: REQUEST → APPROVE (both time-delay)
   * - META_TX_ONLY: REQUEST_AND_APPROVE (single meta-tx)
   * - HYBRID: REQUEST (time-delay) → APPROVE (meta-tx) OR both options available
   */
  classifyWorkflow(workflow: Workflow): WorkflowType {
    const allActions = workflow.operations.flatMap(op => op.requiredActions)
    
    // Check for time-delay request actions
    const hasTimeDelayRequest = allActions.some(action => 
      action === 'EXECUTE_TIME_DELAY_REQUEST'
    )
    
    // Check for time-delay approve actions
    const hasTimeDelayApprove = allActions.some(action => 
      action === 'EXECUTE_TIME_DELAY_APPROVE'
    )
    
    // Check for meta-tx approve actions (after time-delay request)
    const hasMetaTxApprove = allActions.some(action => 
      action === 'EXECUTE_META_APPROVE'
    )
    
    // Check for single meta-tx request+approve
    const hasMetaTxRequestAndApprove = allActions.some(action => 
      action === 'EXECUTE_META_REQUEST_AND_APPROVE'
    )
    
    // Classification logic based on correct understanding
    if (hasTimeDelayRequest && hasTimeDelayApprove && !hasMetaTxApprove && !hasMetaTxRequestAndApprove) {
      return 'TIME_DELAY_ONLY'  // Pure time-delay: REQUEST → APPROVE
    } else if (hasMetaTxRequestAndApprove && !hasTimeDelayRequest && !hasTimeDelayApprove) {
      return 'META_TX_ONLY'  // Single meta-tx: REQUEST_AND_APPROVE
    } else if ((hasTimeDelayRequest && hasMetaTxApprove) || 
               (hasTimeDelayRequest && hasTimeDelayApprove && hasMetaTxRequestAndApprove)) {
      return 'HYBRID'  // Mixed: REQUEST (time-delay) → APPROVE (meta-tx) OR both options
    } else if (allActions.length === 0) {
      return 'BROKEN'
    } else {
      return 'BROKEN'  // Any other pattern is invalid
    }
  }
}
