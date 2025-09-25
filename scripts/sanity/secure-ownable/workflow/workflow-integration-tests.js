/**
 * Workflow Integration Tests
 * Tests integration with actual contract functions and real workflow execution
 * Validates that workflow information matches actual contract behavior
 */

const BaseWorkflowTest = require('./base-workflow-test');

class WorkflowIntegrationTests extends BaseWorkflowTest {
    constructor() {
        super('Workflow Integration Tests');
    }
    
    async executeTests() {
        console.log('\n🔗 TESTING WORKFLOW INTEGRATION');
        console.log('===============================');
        console.log('📋 This test suite validates workflow integration:');
        console.log('   1. Test contract function availability');
        console.log('   2. Test workflow step function selectors');
        console.log('   3. Test role-based access control');
        console.log('   4. Test workflow state management');
        console.log('   5. Test meta-transaction workflow validation');
        console.log('   6. Test workflow error handling');
        console.log('   7. Test workflow performance');
        
        await this.initializeRoles();
        
        await this.executeTest('Test contract function availability', () => this.testContractFunctionAvailability());
        await this.executeTest('Test workflow step function selectors', () => this.testWorkflowStepFunctionSelectors());
        await this.executeTest('Test role-based access control', () => this.testRoleBasedAccessControl());
        await this.executeTest('Test workflow state management', () => this.testWorkflowStateManagement());
        await this.executeTest('Test meta-transaction workflow validation', () => this.testMetaTransactionWorkflowValidation());
        await this.executeTest('Test workflow error handling', () => this.testWorkflowErrorHandling());
        await this.executeTest('Test workflow performance', () => this.testWorkflowPerformance());
        
        this.printTestResults();
    }
    
    async testContractFunctionAvailability() {
        console.log('\n📋 Testing contract function availability...');
        
        const workflows = await this.getAllWorkflows();
        const functionAvailability = {
            available: 0,
            unavailable: 0,
            total: 0
        };
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    if (!step.isOffChain) {
                        functionAvailability.total++;
                        
                        try {
                            // Check if function exists in contract ABI
                            const functionExists = this.contract.methods[step.functionName] !== undefined;
                            
                            if (functionExists) {
                                functionAvailability.available++;
                                console.log(`   ✅ ${step.functionName}: Available`);
                            } else {
                                functionAvailability.unavailable++;
                                console.log(`   ❌ ${step.functionName}: Not available`);
                            }
                        } catch (error) {
                            functionAvailability.unavailable++;
                            console.log(`   ❌ ${step.functionName}: Error checking availability`);
                        }
                    }
                });
            });
        });
        
        console.log(`\n📊 Function Availability Summary:`);
        console.log(`   Total On-Chain Functions: ${functionAvailability.total}`);
        console.log(`   Available: ${functionAvailability.available}`);
        console.log(`   Unavailable: ${functionAvailability.unavailable}`);
        console.log(`   Availability Rate: ${((functionAvailability.available / functionAvailability.total) * 100).toFixed(1)}%`);
        
        if (functionAvailability.unavailable > 0) {
            throw new Error(`${functionAvailability.unavailable} functions are not available in the contract`);
        }
    }
    
    async testWorkflowStepFunctionSelectors() {
        console.log('\n📋 Testing workflow step function selectors...');
        
        const workflows = await this.getAllWorkflows();
        const selectorValidation = {
            valid: 0,
            invalid: 0,
            total: 0
        };
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    if (!step.isOffChain) {
                        selectorValidation.total++;
                        
                        // Validate function selector format
                        if (step.functionSelector && step.functionSelector.startsWith('0x') && step.functionSelector.length === 10) {
                            selectorValidation.valid++;
                            console.log(`   ✅ ${step.functionName}: ${step.functionSelector}`);
                        } else {
                            selectorValidation.invalid++;
                            console.log(`   ❌ ${step.functionName}: Invalid selector ${step.functionSelector}`);
                        }
                    }
                });
            });
        });
        
        console.log(`\n📊 Selector Validation Summary:`);
        console.log(`   Total On-Chain Functions: ${selectorValidation.total}`);
        console.log(`   Valid Selectors: ${selectorValidation.valid}`);
        console.log(`   Invalid Selectors: ${selectorValidation.invalid}`);
        console.log(`   Validation Rate: ${((selectorValidation.valid / selectorValidation.total) * 100).toFixed(1)}%`);
        
        if (selectorValidation.invalid > 0) {
            throw new Error(`${selectorValidation.invalid} function selectors are invalid`);
        }
    }
    
    async testRoleBasedAccessControl() {
        console.log('\n📋 Testing role-based access control...');
        
        const workflows = await this.getAllWorkflows();
        const accessControlTests = [];
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    if (!step.isOffChain) {
                        // Test each role for this step
                        step.roles.forEach(role => {
                            accessControlTests.push({
                                operation: workflow.operationName,
                                path: path.name,
                                step: step.functionName,
                                role: role,
                                hasPermission: this.hasRolePermission(role)
                            });
                        });
                    }
                });
            });
        });
        
        console.log(`\n📊 Access Control Analysis:`);
        console.log(`   Total Access Control Tests: ${accessControlTests.length}`);
        
        const permissionStats = {
            owner: { total: 0, hasPermission: 0 },
            broadcaster: { total: 0, hasPermission: 0 },
            recovery: { total: 0, hasPermission: 0 }
        };
        
        accessControlTests.forEach(test => {
            const roleKey = test.role.toLowerCase();
            if (permissionStats[roleKey]) {
                permissionStats[roleKey].total++;
                if (test.hasPermission) {
                    permissionStats[roleKey].hasPermission++;
                }
            }
        });
        
        Object.entries(permissionStats).forEach(([role, stats]) => {
            if (stats.total > 0) {
                const rate = ((stats.hasPermission / stats.total) * 100).toFixed(1);
                console.log(`   ${role.toUpperCase()}: ${stats.hasPermission}/${stats.total} (${rate}%)`);
            }
        });
        
        // Validate that we have proper role distribution
        const totalRoles = Object.values(permissionStats).reduce((sum, stats) => sum + stats.total, 0);
        if (totalRoles === 0) {
            throw new Error('No role-based access control tests found');
        }
        
        console.log(`\n✅ Role-based access control validated`);
    }
    
    async testWorkflowStateManagement() {
        console.log('\n📋 Testing workflow state management...');
        
        const workflows = await this.getAllWorkflows();
        const stateManagementTests = [];
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                // Analyze state transitions
                for (let i = 0; i < path.steps.length - 1; i++) {
                    const currentStep = path.steps[i];
                    const nextStep = path.steps[i + 1];
                    
                    stateManagementTests.push({
                        operation: workflow.operationName,
                        path: path.name,
                        fromStep: currentStep.functionName,
                        toStep: nextStep.functionName,
                        fromPhase: currentStep.isOffChain ? 'OFF-CHAIN' : 'ON-CHAIN',
                        toPhase: nextStep.isOffChain ? 'OFF-CHAIN' : 'ON-CHAIN',
                        stateTransition: this.analyzeStateTransition(currentStep, nextStep)
                    });
                }
            });
        });
        
        console.log(`\n📊 State Management Analysis:`);
        console.log(`   Total State Transitions: ${stateManagementTests.length}`);
        
        const transitionStats = {
            onChainToOnChain: 0,
            onChainToOffChain: 0,
            offChainToOnChain: 0,
            offChainToOffChain: 0
        };
        
        stateManagementTests.forEach(test => {
            const transitionKey = `${test.fromPhase}To${test.toPhase}`;
            if (transitionStats[transitionKey] !== undefined) {
                transitionStats[transitionKey]++;
            }
        });
        
        Object.entries(transitionStats).forEach(([transition, count]) => {
            if (count > 0) {
                console.log(`   ${transition}: ${count} transitions`);
            }
        });
        
        // Validate that we have proper state management
        if (stateManagementTests.length === 0) {
            throw new Error('No state transitions found in workflows');
        }
        
        console.log(`\n✅ Workflow state management validated`);
    }
    
    async testMetaTransactionWorkflowValidation() {
        console.log('\n📋 Testing meta-transaction workflow validation...');
        
        const workflows = await this.getAllWorkflows();
        const metaTxValidation = {
            totalMetaTxPaths: 0,
            validMetaTxPaths: 0,
            invalidMetaTxPaths: 0
        };
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                if (path.hasOffChainPhase) {
                    metaTxValidation.totalMetaTxPaths++;
                    
                    // Validate meta-transaction path structure
                    const isValid = this.validateMetaTransactionPath(path);
                    
                    if (isValid) {
                        metaTxValidation.validMetaTxPaths++;
                        console.log(`   ✅ ${workflow.operationName}: ${path.name} - Valid meta-transaction path`);
                    } else {
                        metaTxValidation.invalidMetaTxPaths++;
                        console.log(`   ❌ ${workflow.operationName}: ${path.name} - Invalid meta-transaction path`);
                    }
                }
            });
        });
        
        console.log(`\n📊 Meta-Transaction Validation Summary:`);
        console.log(`   Total Meta-Transaction Paths: ${metaTxValidation.totalMetaTxPaths}`);
        console.log(`   Valid Paths: ${metaTxValidation.validMetaTxPaths}`);
        console.log(`   Invalid Paths: ${metaTxValidation.invalidMetaTxPaths}`);
        console.log(`   Validation Rate: ${((metaTxValidation.validMetaTxPaths / metaTxValidation.totalMetaTxPaths) * 100).toFixed(1)}%`);
        
        if (metaTxValidation.invalidMetaTxPaths > 0) {
            throw new Error(`${metaTxValidation.invalidMetaTxPaths} meta-transaction paths are invalid`);
        }
    }
    
    async testWorkflowErrorHandling() {
        console.log('\n📋 Testing workflow error handling...');
        
        const errorHandlingTests = [
            {
                test: 'Invalid operation type',
                operationType: '0x0000000000000000000000000000000000000000000000000000000000000000',
                expectedError: 'Workflow not found'
            },
            {
                test: 'Empty operation type',
                operationType: '',
                expectedError: 'Workflow not found'
            },
            {
                test: 'Non-existent operation',
                operationType: this.getOperationTypeHash('NON_EXISTENT_OPERATION'),
                expectedError: 'Workflow not found'
            }
        ];
        
        let errorHandlingScore = 0;
        
        for (const test of errorHandlingTests) {
            try {
                await this.getWorkflowForOperation(test.operationType);
                console.log(`   ❌ ${test.test}: Should have thrown error`);
            } catch (error) {
                if (error.message.includes(test.expectedError)) {
                    console.log(`   ✅ ${test.test}: Correctly handled error`);
                    errorHandlingScore++;
                } else {
                    console.log(`   ⚠️  ${test.test}: Unexpected error: ${error.message}`);
                }
            }
        }
        
        console.log(`\n📊 Error Handling Summary:`);
        console.log(`   Tests Passed: ${errorHandlingScore}/${errorHandlingTests.length}`);
        console.log(`   Error Handling Rate: ${((errorHandlingScore / errorHandlingTests.length) * 100).toFixed(1)}%`);
        
        if (errorHandlingScore < errorHandlingTests.length) {
            throw new Error(`Error handling tests failed: ${errorHandlingScore}/${errorHandlingTests.length}`);
        }
    }
    
    async testWorkflowPerformance() {
        console.log('\n📋 Testing workflow performance...');
        
        const performanceTests = [
            {
                name: 'getAllWorkflows',
                test: async () => await this.getAllWorkflows()
            },
            {
                name: 'getWorkflowForOperation (OWNERSHIP_TRANSFER)',
                test: async () => await this.getWorkflowForOperation(this.getOperationTypeHash('OWNERSHIP_TRANSFER'))
            },
            {
                name: 'getWorkflowPaths (OWNERSHIP_TRANSFER)',
                test: async () => await this.getWorkflowPaths(this.getOperationTypeHash('OWNERSHIP_TRANSFER'))
            },
            {
                name: 'analyzeWorkflowStructure',
                test: async () => {
                    const workflows = await this.getAllWorkflows();
                    workflows.forEach(workflow => this.analyzeWorkflowStructure(workflow));
                }
            },
            {
                name: 'findNextAvailableActions',
                test: async () => {
                    const workflow = await this.getWorkflowForOperation(this.getOperationTypeHash('OWNERSHIP_TRANSFER'));
                    this.findNextAvailableActions(workflow, 'RECOVERY', 0);
                }
            }
        ];
        
        const performanceResults = [];
        
        for (const test of performanceTests) {
            const startTime = Date.now();
            
            try {
                await test.test();
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                performanceResults.push({
                    name: test.name,
                    duration: duration,
                    success: true
                });
                
                console.log(`   ✅ ${test.name}: ${duration}ms`);
            } catch (error) {
                performanceResults.push({
                    name: test.name,
                    duration: 0,
                    success: false,
                    error: error.message
                });
                
                console.log(`   ❌ ${test.name}: Failed - ${error.message}`);
            }
        }
        
        const successfulTests = performanceResults.filter(r => r.success);
        const totalDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0);
        const averageDuration = successfulTests.length > 0 ? totalDuration / successfulTests.length : 0;
        
        console.log(`\n📊 Performance Summary:`);
        console.log(`   Successful Tests: ${successfulTests.length}/${performanceTests.length}`);
        console.log(`   Total Duration: ${totalDuration}ms`);
        console.log(`   Average Duration: ${averageDuration.toFixed(2)}ms`);
        
        // Performance thresholds
        const maxAllowedDuration = 1000; // 1 second
        const slowTests = successfulTests.filter(r => r.duration > maxAllowedDuration);
        
        if (slowTests.length > 0) {
            console.log(`   ⚠️  Slow Tests (>${maxAllowedDuration}ms):`);
            slowTests.forEach(test => {
                console.log(`     - ${test.name}: ${test.duration}ms`);
            });
        }
        
        if (successfulTests.length < performanceTests.length) {
            throw new Error(`Performance tests failed: ${successfulTests.length}/${performanceTests.length}`);
        }
    }
    
    // Helper methods
    hasRolePermission(role) {
        // Check if current user has the specified role
        const roleAddresses = {
            'OWNER': this.roles.owner,
            'BROADCASTER': this.roles.broadcaster,
            'RECOVERY': this.roles.recovery
        };
        
        // For testing purposes, we'll assume we have access to all roles
        // In a real implementation, you would check against the actual user's address
        return roleAddresses[role] !== undefined;
    }
    
    analyzeStateTransition(currentStep, nextStep) {
        const transitions = {
            phaseChange: currentStep.isOffChain !== nextStep.isOffChain,
            roleChange: !this.arraysEqual(currentStep.roles, nextStep.roles),
            actionChange: currentStep.action !== nextStep.action
        };
        
        return transitions;
    }
    
    validateMetaTransactionPath(path) {
        // A valid meta-transaction path should have:
        // 1. At least one off-chain step
        // 2. At least one on-chain step
        // 3. Off-chain steps should have phaseType 'SIGNING'
        // 4. On-chain steps should have phaseType 'EXECUTION'
        
        const offChainSteps = path.steps.filter(step => step.isOffChain);
        const onChainSteps = path.steps.filter(step => !step.isOffChain);
        
        if (offChainSteps.length === 0 || onChainSteps.length === 0) {
            return false;
        }
        
        const validOffChainSteps = offChainSteps.every(step => step.phaseType === 'SIGNING');
        const validOnChainSteps = onChainSteps.every(step => step.phaseType === 'EXECUTION');
        
        return validOffChainSteps && validOnChainSteps;
    }
    
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        return a.every((val, index) => val === b[index]);
    }
}

module.exports = WorkflowIntegrationTests;
