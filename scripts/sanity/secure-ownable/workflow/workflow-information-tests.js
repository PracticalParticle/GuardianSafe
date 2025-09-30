/**
 * Workflow Information Tests
 * Tests the workflow information system functionality
 * Validates that all workflow data is correctly retrieved and structured
 */

const BaseWorkflowTest = require('./base-workflow-test');

class WorkflowInformationTests extends BaseWorkflowTest {
    constructor() {
        super('Workflow Information Tests');
    }
    
    async executeTests() {
        console.log('\n🔍 TESTING WORKFLOW INFORMATION SYSTEM');
        console.log('========================================');
        console.log('📋 This test suite validates the workflow information system:');
        console.log('   1. Test getAllWorkflows() function');
        console.log('   2. Test getWorkflowForOperation() function');
        console.log('   3. Test getWorkflowPaths() function');
        console.log('   4. Validate workflow data structure');
        console.log('   5. Test role array functionality');
        console.log('   6. Test off-chain phase detection');
        console.log('   7. Test programmatic workflow analysis');
        
        await this.initializeRoles();
        
        await this.executeTest('Test getAllWorkflows', () => this.testGetAllWorkflows());
        await this.executeTest('Test getWorkflowForOperation', () => this.testGetWorkflowForOperation());
        await this.executeTest('Test getWorkflowPaths', () => this.testGetWorkflowPaths());
        await this.executeTest('Validate workflow data structure', () => this.testWorkflowDataStructure());
        await this.executeTest('Test role array functionality', () => this.testRoleArrayFunctionality());
        await this.executeTest('Test off-chain phase detection', () => this.testOffChainPhaseDetection());
        await this.executeTest('Test programmatic workflow analysis', () => this.testProgrammaticWorkflowAnalysis());
        
        this.printTestResults();
    }
    
    async testGetAllWorkflows() {
        console.log('\n📋 Testing getAllWorkflows() function...');
        
        const workflows = await this.getAllWorkflows();
        
        // Validate basic structure
        if (!Array.isArray(workflows)) {
            throw new Error('getAllWorkflows() should return an array');
        }
        
        if (workflows.length === 0) {
            throw new Error('getAllWorkflows() should return at least one workflow');
        }
        
        // Validate expected operations
        const expectedOperations = ['OWNERSHIP_TRANSFER', 'BROADCASTER_UPDATE', 'RECOVERY_UPDATE', 'TIMELOCK_UPDATE'];
        const foundOperations = workflows.map(w => w.operationName);
        
        for (const expectedOp of expectedOperations) {
            if (!foundOperations.includes(expectedOp)) {
                throw new Error(`Expected operation ${expectedOp} not found in workflows`);
            }
        }
        
        console.log(`✅ Found ${workflows.length} operation workflows`);
        workflows.forEach(workflow => {
            console.log(`   - ${workflow.operationName}: ${workflow.paths.length} paths`);
        });
    }
    
    async testGetWorkflowForOperation() {
        console.log('\n📋 Testing getWorkflowForOperation() function...');
        
        const testOperations = [
            'OWNERSHIP_TRANSFER',
            'BROADCASTER_UPDATE',
            'RECOVERY_UPDATE',
            'TIMELOCK_UPDATE'
        ];
        
        for (const operationName of testOperations) {
            const operationType = this.getOperationTypeHash(operationName);
            const workflow = await this.getWorkflowForOperation(operationType);
            
            // Validate workflow structure
            if (!workflow.operationName) {
                throw new Error(`Workflow for ${operationName} missing operationName`);
            }
            
            if (!workflow.operationType) {
                throw new Error(`Workflow for ${operationName} missing operationType`);
            }
            
            if (!Array.isArray(workflow.paths)) {
                throw new Error(`Workflow for ${operationName} paths should be an array`);
            }
            
            if (!Array.isArray(workflow.supportedRoles)) {
                throw new Error(`Workflow for ${operationName} supportedRoles should be an array`);
            }
            
            if (workflow.paths.length === 0) {
                throw new Error(`Workflow for ${operationName} should have at least one path`);
            }
            
            console.log(`✅ ${operationName}: ${workflow.paths.length} paths, ${workflow.supportedRoles.length} roles`);
        }
    }
    
    async testGetWorkflowPaths() {
        console.log('\n📋 Testing getWorkflowPaths() function...');
        
        const operationType = this.getOperationTypeHash('OWNERSHIP_TRANSFER');
        const paths = await this.getWorkflowPaths(operationType);
        
        // Validate paths structure
        if (!Array.isArray(paths)) {
            throw new Error('getWorkflowPaths() should return an array');
        }
        
        if (paths.length === 0) {
            throw new Error('getWorkflowPaths() should return at least one path');
        }
        
        // Validate each path structure
        paths.forEach((path, index) => {
            if (!path.name) {
                throw new Error(`Path ${index} missing name`);
            }
            
            if (!path.description) {
                throw new Error(`Path ${index} missing description`);
            }
            
            if (!Array.isArray(path.steps)) {
                throw new Error(`Path ${index} steps should be an array`);
            }
            
            if (path.steps.length === 0) {
                throw new Error(`Path ${index} should have at least one step`);
            }
            
            // Validate step structure
            path.steps.forEach((step, stepIndex) => {
                if (!step.functionName) {
                    throw new Error(`Path ${index}, Step ${stepIndex} missing functionName`);
                }
                
                if (!Array.isArray(step.roles)) {
                    throw new Error(`Path ${index}, Step ${stepIndex} roles should be an array`);
                }
                
                if (step.roles.length === 0) {
                    throw new Error(`Path ${index}, Step ${stepIndex} should have at least one role`);
                }
                
                if (typeof step.isOffChain !== 'boolean') {
                    throw new Error(`Path ${index}, Step ${stepIndex} isOffChain should be boolean`);
                }
                
                if (!step.phaseType) {
                    throw new Error(`Path ${index}, Step ${stepIndex} missing phaseType`);
                }
            });
        });
        
        console.log(`✅ Retrieved ${paths.length} workflow paths for OWNERSHIP_TRANSFER`);
        paths.forEach((path, index) => {
            console.log(`   ${index + 1}. ${path.name}: ${path.steps.length} steps`);
        });
    }
    
    async testWorkflowDataStructure() {
        console.log('\n📋 Testing workflow data structure validation...');
        
        const workflows = await this.getAllWorkflows();
        
        workflows.forEach(workflow => {
            const analysis = this.analyzeWorkflowStructure(workflow);
            
            console.log(`\n📊 Analysis for ${analysis.operationName}:`);
            console.log(`   Total Paths: ${analysis.totalPaths}`);
            console.log(`   Total Steps: ${analysis.totalSteps}`);
            console.log(`   Workflow Types: ${Array.from(analysis.workflowTypes).join(', ')}`);
            console.log(`   Roles Used: ${Array.from(analysis.roles).join(', ')}`);
            console.log(`   Has Off-Chain Phase: ${analysis.hasOffChainPhase}`);
            console.log(`   Has On-Chain Phase: ${analysis.hasOnChainPhase}`);
            console.log(`   Signature Required: ${analysis.signatureRequired}/${analysis.totalPaths}`);
            console.log(`   Immediate Execution: ${analysis.immediateExecution}/${analysis.totalPaths}`);
            console.log(`   Time Delayed Execution: ${analysis.timeDelayedExecution}/${analysis.totalPaths}`);
            
            // Validate expected structure
            if (analysis.totalSteps === 0) {
                throw new Error(`${analysis.operationName} should have at least one step`);
            }
            
            if (analysis.roles.size === 0) {
                throw new Error(`${analysis.operationName} should use at least one role`);
            }
            
            // Validate role consistency
            const expectedRoles = ['OWNER', 'BROADCASTER', 'RECOVERY'];
            const foundRoles = Array.from(analysis.roles);
            const validRoles = foundRoles.every(role => expectedRoles.includes(role));
            
            if (!validRoles) {
                throw new Error(`${analysis.operationName} contains invalid roles: ${foundRoles.join(', ')}`);
            }
        });
        
        console.log('\n✅ All workflow data structures validated successfully');
    }
    
    async testRoleArrayFunctionality() {
        console.log('\n📋 Testing role array functionality...');
        
        const workflows = await this.getAllWorkflows();
        let singleRoleSteps = 0;
        let multiRoleSteps = 0;
        let totalSteps = 0;
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    totalSteps++;
                    
                    if (step.roles.length === 1) {
                        singleRoleSteps++;
                    } else {
                        multiRoleSteps++;
                    }
                    
                    // Validate role array structure
                    if (!Array.isArray(step.roles)) {
                        throw new Error(`Step ${step.functionName} roles should be an array`);
                    }
                    
                    if (step.roles.length === 0) {
                        throw new Error(`Step ${step.functionName} should have at least one role`);
                    }
                    
                    // Validate role values
                    const validRoles = ['OWNER', 'BROADCASTER', 'RECOVERY'];
                    const invalidRoles = step.roles.filter(role => !validRoles.includes(role));
                    
                    if (invalidRoles.length > 0) {
                        throw new Error(`Step ${step.functionName} contains invalid roles: ${invalidRoles.join(', ')}`);
                    }
                });
            });
        });
        
        console.log(`✅ Role array analysis:`);
        console.log(`   Total Steps: ${totalSteps}`);
        console.log(`   Single Role Steps: ${singleRoleSteps} (${((singleRoleSteps / totalSteps) * 100).toFixed(1)}%)`);
        console.log(`   Multi-Role Steps: ${multiRoleSteps} (${((multiRoleSteps / totalSteps) * 100).toFixed(1)}%)`);
        
        // Test specific multi-role case
        const ownershipWorkflow = workflows.find(w => w.operationName === 'OWNERSHIP_TRANSFER');
        if (ownershipWorkflow) {
            const multiRoleSteps = [];
            ownershipWorkflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    if (step.roles.length > 1) {
                        multiRoleSteps.push(step);
                    }
                });
            });
            
            if (multiRoleSteps.length > 0) {
                console.log(`✅ Found ${multiRoleSteps.length} multi-role steps in OWNERSHIP_TRANSFER`);
                multiRoleSteps.forEach(step => {
                    console.log(`   - ${step.functionName}: ${step.roles.join(' or ')}`);
                });
            }
        }
    }
    
    async testOffChainPhaseDetection() {
        console.log('\n📋 Testing off-chain phase detection...');
        
        const workflows = await this.getAllWorkflows();
        let totalOffChainSteps = 0;
        let totalOnChainSteps = 0;
        let totalMetaTxPaths = 0;
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                if (path.hasOffChainPhase) {
                    totalMetaTxPaths++;
                }
                
                path.steps.forEach(step => {
                    if (step.isOffChain) {
                        totalOffChainSteps++;
                        
                        // Validate off-chain step properties
                        if (step.phaseType !== 'SIGNING') {
                            throw new Error(`Off-chain step ${step.functionName} should have phaseType 'SIGNING'`);
                        }
                        
                        if (step.functionSelector !== '0x00000000') {
                            throw new Error(`Off-chain step ${step.functionName} should have functionSelector '0x00000000'`);
                        }
                    } else {
                        totalOnChainSteps++;
                        
                        // Validate on-chain step properties
                        if (step.phaseType !== 'EXECUTION') {
                            throw new Error(`On-chain step ${step.functionName} should have phaseType 'EXECUTION'`);
                        }
                        
                        if (step.functionSelector === '0x00000000') {
                            throw new Error(`On-chain step ${step.functionName} should not have functionSelector '0x00000000'`);
                        }
                    }
                });
            });
        });
        
        console.log(`✅ Off-chain phase analysis:`);
        console.log(`   Total Meta-Transaction Paths: ${totalMetaTxPaths}`);
        console.log(`   Total Off-Chain Steps: ${totalOffChainSteps}`);
        console.log(`   Total On-Chain Steps: ${totalOnChainSteps}`);
        
        // Validate meta-transaction workflow structure
        const metaTxWorkflows = workflows.filter(workflow => 
            workflow.paths.some(path => path.hasOffChainPhase)
        );
        
        console.log(`✅ Found ${metaTxWorkflows.length} workflows with meta-transaction paths`);
        metaTxWorkflows.forEach(workflow => {
            const metaTxPaths = workflow.paths.filter(path => path.hasOffChainPhase);
            console.log(`   - ${workflow.operationName}: ${metaTxPaths.length} meta-transaction paths`);
        });
    }
    
    async testProgrammaticWorkflowAnalysis() {
        console.log('\n📋 Testing programmatic workflow analysis...');
        
        const workflows = await this.getAllWorkflows();
        const testScenarios = [
            {
                userRole: 'RECOVERY',
                operation: 'OWNERSHIP_TRANSFER',
                currentStep: 0,
                description: 'Recovery user starting ownership transfer'
            },
            {
                userRole: 'OWNER',
                operation: 'OWNERSHIP_TRANSFER',
                currentStep: 1,
                description: 'Owner user approving after request'
            },
            {
                userRole: 'BROADCASTER',
                operation: 'OWNERSHIP_TRANSFER',
                currentStep: 2,
                description: 'Broadcaster user executing meta-transaction'
            },
            {
                userRole: 'OWNER',
                operation: 'BROADCASTER_UPDATE',
                currentStep: 0,
                description: 'Owner user updating broadcaster'
            }
        ];
        
        for (const scenario of testScenarios) {
            console.log(`\n🧪 Testing scenario: ${scenario.description}`);
            
            const workflow = workflows.find(w => w.operationName === scenario.operation);
            if (!workflow) {
                throw new Error(`Workflow not found for operation: ${scenario.operation}`);
            }
            
            const availableActions = this.findNextAvailableActions(workflow, scenario.userRole, scenario.currentStep);
            
            if (availableActions.length === 0) {
                console.log(`   ⚠️  No available actions for ${scenario.userRole} at step ${scenario.currentStep}`);
            } else {
                console.log(`   ✅ Found ${availableActions.length} paths with available actions`);
                
                availableActions.forEach((pathActions, pathIndex) => {
                    console.log(`     Path ${pathIndex + 1}: ${pathActions.path.name}`);
                    console.log(`       Available actions: ${pathActions.actions.length}`);
                    
                    pathActions.actions.forEach(action => {
                        const phaseIcon = action.step.isOffChain ? '🔐' : '⚡';
                        const phaseText = action.step.isOffChain ? 'OFF-CHAIN' : 'ON-CHAIN';
                        console.log(`         ${action.stepIndex + 1}. ${phaseIcon} ${action.step.functionName} (${phaseText})`);
                        console.log(`            Roles: ${action.step.roles.join(' or ')}`);
                        console.log(`            Action: ${action.step.action}`);
                    });
                });
            }
        }
        
        console.log('\n✅ Programmatic workflow analysis completed successfully');
    }
}

module.exports = WorkflowInformationTests;
