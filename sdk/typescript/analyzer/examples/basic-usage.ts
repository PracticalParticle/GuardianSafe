// SPDX-License-Identifier: MPL-2.0
// Basic Usage Example for Guardian Workflow Analyzer

import { WorkflowAnalyzer } from '../WorkflowAnalyzer'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

/**
 * @dev Example: Basic contract analysis
 */
async function basicAnalysis() {
  console.log('🚀 Guardian Workflow Analyzer - Basic Usage Example\n')

  // Initialize client (using mainnet for example)
  const client = createPublicClient({
    chain: mainnet,
    transport: http()
  })

  // Create analyzer
  const analyzer = new WorkflowAnalyzer(client)

  // Example contract addresses (replace with actual Guardian contracts)
  const exampleContracts = [
    '0x1234567890123456789012345678901234567890', // SecureOwnable example
    '0x2345678901234567890123456789012345678901', // MultiPhase example
    '0x3456789012345678901234567890123456789012'  // DynamicRBAC example
  ]

  console.log('📋 Analyzing example contracts...\n')

  for (const contractAddress of exampleContracts) {
    try {
      console.log(`🔍 Analyzing contract: ${contractAddress}`)
      
      // Analyze contract
      const analysis = await analyzer.analyzeContract(contractAddress as `0x${string}`)
      
      // Display results
      console.log(`📊 Analysis Results:`)
      console.log(`   Definition Type: ${analysis.definitionType}`)
      console.log(`   Operation Types: ${analysis.operationTypes.length}`)
      console.log(`   Function Schemas: ${analysis.functionSchemas.length}`)
      console.log(`   Role Permissions: ${analysis.rolePermissions.length}`)
      console.log(`   Workflows: ${analysis.workflows.length}`)
      console.log(`   Compliance Score: ${analysis.complianceScore}%`)
      
      // Check workflow validity
      const validWorkflows = analysis.workflows.filter(w => w.isValid).length
      const brokenWorkflows = analysis.workflows.filter(w => !w.isValid).length
      
      console.log(`   Valid Workflows: ${validWorkflows}`)
      console.log(`   Broken Workflows: ${brokenWorkflows}`)
      
      // Display workflow details
      if (analysis.workflows.length > 0) {
        console.log(`   Workflow Details:`)
        for (const workflow of analysis.workflows) {
          console.log(`     - ${workflow.name} (${workflow.type})`)
          if (!workflow.isValid) {
            console.log(`       ❌ Errors: ${workflow.validationErrors.join(', ')}`)
          } else {
            console.log(`       ✅ Valid`)
          }
        }
      }
      
      console.log('')
      
    } catch (error) {
      console.log(`❌ Error analyzing ${contractAddress}: ${error}`)
      console.log('')
    }
  }
}

/**
 * @dev Example: Protocol compliance checking
 */
async function complianceCheck() {
  console.log('🔍 Protocol Compliance Check Example\n')

  const client = createPublicClient({
    chain: mainnet,
    transport: http()
  })

  const analyzer = new WorkflowAnalyzer(client)
  const contractAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`

  try {
    // Check compliance
    const compliance = await analyzer.checkProtocolCompliance(contractAddress)
    
    console.log(`📊 Compliance Results:`)
    console.log(`   Compliant: ${compliance.isCompliant ? '✅ Yes' : '❌ No'}`)
    console.log(`   Score: ${compliance.score}%`)
    
    // Display violations
    if (compliance.violations.length > 0) {
      console.log(`   Violations (${compliance.violations.length}):`)
      for (const violation of compliance.violations) {
        console.log(`     ${violation.severity}: ${violation.description}`)
        console.log(`       Recommendation: ${violation.recommendation}`)
      }
    }
    
    // Display recommendations
    if (compliance.recommendations.length > 0) {
      console.log(`   Recommendations:`)
      for (const recommendation of compliance.recommendations) {
        console.log(`     - ${recommendation}`)
      }
    }
    
  } catch (error) {
    console.log(`❌ Error checking compliance: ${error}`)
  }
}

/**
 * @dev Example: Workflow statistics
 */
async function workflowStatistics() {
  console.log('📈 Workflow Statistics Example\n')

  const client = createPublicClient({
    chain: mainnet,
    transport: http()
  })

  const analyzer = new WorkflowAnalyzer(client)
  const contractAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`

  try {
    // Generate workflows
    const workflows = await analyzer.generateWorkflows(contractAddress)
    
    // Get statistics
    const stats = analyzer.analyzeWorkflowStatistics(workflows)
    
    console.log(`📊 Workflow Statistics:`)
    console.log(`   Total Workflows: ${stats.totalWorkflows}`)
    console.log(`   Valid Workflows: ${stats.validWorkflows}`)
    console.log(`   Broken Workflows: ${stats.brokenWorkflows}`)
    console.log(`   Total Operations: ${stats.totalOperations}`)
    console.log(`   Total State Transitions: ${stats.totalStateTransitions}`)
    console.log(`   Average Operations per Workflow: ${stats.averageOperationsPerWorkflow.toFixed(2)}`)
    console.log(`   Average State Transitions per Workflow: ${stats.averageStateTransitionsPerWorkflow.toFixed(2)}`)
    
    // Display workflow types
    console.log(`   Workflow Types:`)
    for (const [type, count] of Object.entries(stats.workflowTypes)) {
      console.log(`     ${type}: ${count}`)
    }
    
  } catch (error) {
    console.log(`❌ Error getting statistics: ${error}`)
  }
}

/**
 * @dev Example: Broken workflow detection
 */
async function brokenWorkflowDetection() {
  console.log('🔍 Broken Workflow Detection Example\n')

  const client = createPublicClient({
    chain: mainnet,
    transport: http()
  })

  const analyzer = new WorkflowAnalyzer(client)
  const contractAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`

  try {
    // Generate workflows
    const workflows = await analyzer.generateWorkflows(contractAddress)
    
    // Detect broken workflows
    const brokenWorkflows = analyzer.detectBrokenWorkflows(workflows)
    
    console.log(`📊 Broken Workflow Detection:`)
    console.log(`   Total Workflows: ${workflows.length}`)
    console.log(`   Broken Workflows: ${brokenWorkflows.length}`)
    
    if (brokenWorkflows.length > 0) {
      console.log(`   Broken Workflow Details:`)
      for (const broken of brokenWorkflows) {
        console.log(`     - ${broken.name}`)
        console.log(`       Type: ${broken.type}`)
        console.log(`       Errors: ${broken.validationErrors.join(', ')}`)
      }
    } else {
      console.log(`   ✅ No broken workflows detected`)
    }
    
  } catch (error) {
    console.log(`❌ Error detecting broken workflows: ${error}`)
  }
}

/**
 * @dev Main example runner
 */
async function runExamples() {
  console.log('🎯 Guardian Workflow Analyzer Examples\n')
  console.log('=====================================\n')
  
  try {
    await basicAnalysis()
    await complianceCheck()
    await workflowStatistics()
    await brokenWorkflowDetection()
    
    console.log('✅ All examples completed successfully!')
    
  } catch (error) {
    console.log(`❌ Example execution failed: ${error}`)
  }
}

// Export for use in other modules
export {
  basicAnalysis,
  complianceCheck,
  workflowStatistics,
  brokenWorkflowDetection,
  runExamples
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error)
}
