/**
 * Workflow Analysis Tests
 * Advanced analysis and validation of workflow patterns, security, and optimization
 */

const BaseWorkflowTest = require('./base-workflow-test');

class WorkflowAnalysisTests extends BaseWorkflowTest {
    constructor() {
        super('Workflow Analysis Tests');
    }
    
    async executeTests() {
        console.log('\n🔍 TESTING WORKFLOW ANALYSIS');
        console.log('============================');
        console.log('📋 This test suite validates advanced workflow analysis:');
        console.log('   1. Test workflow pattern analysis');
        console.log('   2. Test workflow security analysis');
        console.log('   3. Test workflow optimization analysis');
        console.log('   4. Test workflow completeness analysis');
        console.log('   5. Test workflow consistency analysis');
        console.log('   6. Test workflow scalability analysis');
        console.log('   7. Test workflow maintainability analysis');
        
        await this.initializeRoles();
        
        await this.executeTest('Test workflow pattern analysis', () => this.testWorkflowPatternAnalysis());
        await this.executeTest('Test workflow security analysis', () => this.testWorkflowSecurityAnalysis());
        await this.executeTest('Test workflow optimization analysis', () => this.testWorkflowOptimizationAnalysis());
        await this.executeTest('Test workflow completeness analysis', () => this.testWorkflowCompletenessAnalysis());
        await this.executeTest('Test workflow consistency analysis', () => this.testWorkflowConsistencyAnalysis());
        await this.executeTest('Test workflow scalability analysis', () => this.testWorkflowScalabilityAnalysis());
        await this.executeTest('Test workflow maintainability analysis', () => this.testWorkflowMaintainabilityAnalysis());
        
        this.printTestResults();
    }
    
    async testWorkflowPatternAnalysis() {
        console.log('\n📋 Testing workflow pattern analysis...');
        
        const workflows = await this.getAllWorkflows();
        const patternAnalysis = {
            totalWorkflows: workflows.length,
            totalPaths: 0,
            totalSteps: 0,
            workflowTypes: { 0: 0, 1: 0, 2: 0, 3: 0 },
            roleDistribution: {},
            phaseDistribution: { offChain: 0, onChain: 0 },
            signatureDistribution: { required: 0, notRequired: 0 },
            timeDistribution: { immediate: 0, delayed: 0 }
        };
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                patternAnalysis.totalPaths++;
                patternAnalysis.totalSteps += path.steps.length;
                patternAnalysis.workflowTypes[path.workflowType]++;
                
                if (path.requiresSignature) {
                    patternAnalysis.signatureDistribution.required++;
                } else {
                    patternAnalysis.signatureDistribution.notRequired++;
                }
                
                if (path.estimatedTimeSec === 0) {
                    patternAnalysis.timeDistribution.immediate++;
                } else {
                    patternAnalysis.timeDistribution.delayed++;
                }
                
                if (path.hasOffChainPhase) {
                    patternAnalysis.phaseDistribution.offChain++;
                } else {
                    patternAnalysis.phaseDistribution.onChain++;
                }
                
                path.steps.forEach(step => {
                    step.roles.forEach(role => {
                        patternAnalysis.roleDistribution[role] = (patternAnalysis.roleDistribution[role] || 0) + 1;
                    });
                    
                    if (step.isOffChain) {
                        patternAnalysis.phaseDistribution.offChain++;
                    } else {
                        patternAnalysis.phaseDistribution.onChain++;
                    }
                });
            });
        });
        
        console.log(`\n📊 Workflow Pattern Analysis:`);
        console.log(`   Total Workflows: ${patternAnalysis.totalWorkflows}`);
        console.log(`   Total Paths: ${patternAnalysis.totalPaths}`);
        console.log(`   Total Steps: ${patternAnalysis.totalSteps}`);
        console.log(`   Average Steps per Path: ${(patternAnalysis.totalSteps / patternAnalysis.totalPaths).toFixed(2)}`);
        
        console.log(`\n📊 Workflow Type Distribution:`);
        const typeNames = ['TIME_DELAY_ONLY', 'META_TX_ONLY', 'HYBRID', 'SINGLE_PHASE'];
        typeNames.forEach((name, index) => {
            console.log(`   ${name}: ${patternAnalysis.workflowTypes[index]} paths`);
        });
        
        console.log(`\n📊 Role Distribution:`);
        Object.entries(patternAnalysis.roleDistribution).forEach(([role, count]) => {
            console.log(`   ${role}: ${count} steps`);
        });
        
        console.log(`\n📊 Phase Distribution:`);
        console.log(`   Off-Chain Steps: ${patternAnalysis.phaseDistribution.offChain}`);
        console.log(`   On-Chain Steps: ${patternAnalysis.phaseDistribution.onChain}`);
        
        console.log(`\n📊 Signature Distribution:`);
        console.log(`   Signature Required: ${patternAnalysis.signatureDistribution.required}`);
        console.log(`   No Signature Required: ${patternAnalysis.signatureDistribution.notRequired}`);
        
        console.log(`\n📊 Time Distribution:`);
        console.log(`   Immediate Execution: ${patternAnalysis.timeDistribution.immediate}`);
        console.log(`   Delayed Execution: ${patternAnalysis.timeDistribution.delayed}`);
        
        // Validate pattern consistency
        if (patternAnalysis.totalWorkflows === 0) {
            throw new Error('No workflows found for pattern analysis');
        }
        
        if (patternAnalysis.totalPaths === 0) {
            throw new Error('No workflow paths found for pattern analysis');
        }
        
        console.log(`\n✅ Workflow pattern analysis completed`);
    }
    
    async testWorkflowSecurityAnalysis() {
        console.log('\n📋 Testing workflow security analysis...');
        
        const workflows = await this.getAllWorkflows();
        const securityAnalysis = {
            totalPaths: 0,
            securePaths: 0,
            insecurePaths: 0,
            securityIssues: []
        };
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                securityAnalysis.totalPaths++;
                
                const securityScore = this.analyzePathSecurity(path);
                
                if (securityScore.score >= 80) {
                    securityAnalysis.securePaths++;
                    console.log(`   ✅ ${workflow.operationName}: ${path.name} - Secure (${securityScore.score}/100)`);
                } else {
                    securityAnalysis.insecurePaths++;
                    console.log(`   ⚠️  ${workflow.operationName}: ${path.name} - Security concerns (${securityScore.score}/100)`);
                    securityAnalysis.securityIssues.push(...securityScore.issues);
                }
            });
        });
        
        console.log(`\n📊 Security Analysis Summary:`);
        console.log(`   Total Paths: ${securityAnalysis.totalPaths}`);
        console.log(`   Secure Paths: ${securityAnalysis.securePaths}`);
        console.log(`   Insecure Paths: ${securityAnalysis.insecurePaths}`);
        console.log(`   Security Rate: ${((securityAnalysis.securePaths / securityAnalysis.totalPaths) * 100).toFixed(1)}%`);
        
        if (securityAnalysis.securityIssues.length > 0) {
            console.log(`\n⚠️  Security Issues Found:`);
            securityAnalysis.securityIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        // Security threshold: at least 80% of paths should be secure
        const securityThreshold = 80;
        const securityRate = (securityAnalysis.securePaths / securityAnalysis.totalPaths) * 100;
        
        if (securityRate < securityThreshold) {
            throw new Error(`Security rate ${securityRate.toFixed(1)}% is below threshold ${securityThreshold}%`);
        }
        
        console.log(`\n✅ Workflow security analysis completed`);
    }
    
    async testWorkflowOptimizationAnalysis() {
        console.log('\n📋 Testing workflow optimization analysis...');
        
        const workflows = await this.getAllWorkflows();
        const optimizationAnalysis = {
            totalPaths: 0,
            optimizedPaths: 0,
            unoptimizedPaths: 0,
            optimizationSuggestions: []
        };
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                optimizationAnalysis.totalPaths++;
                
                const optimizationScore = this.analyzePathOptimization(path);
                
                if (optimizationScore.score >= 70) {
                    optimizationAnalysis.optimizedPaths++;
                    console.log(`   ✅ ${workflow.operationName}: ${path.name} - Optimized (${optimizationScore.score}/100)`);
                } else {
                    optimizationAnalysis.unoptimizedPaths++;
                    console.log(`   ⚠️  ${workflow.operationName}: ${path.name} - Optimization opportunities (${optimizationScore.score}/100)`);
                    optimizationAnalysis.optimizationSuggestions.push(...optimizationScore.suggestions);
                }
            });
        });
        
        console.log(`\n📊 Optimization Analysis Summary:`);
        console.log(`   Total Paths: ${optimizationAnalysis.totalPaths}`);
        console.log(`   Optimized Paths: ${optimizationAnalysis.optimizedPaths}`);
        console.log(`   Unoptimized Paths: ${optimizationAnalysis.unoptimizedPaths}`);
        console.log(`   Optimization Rate: ${((optimizationAnalysis.optimizedPaths / optimizationAnalysis.totalPaths) * 100).toFixed(1)}%`);
        
        if (optimizationAnalysis.optimizationSuggestions.length > 0) {
            console.log(`\n💡 Optimization Suggestions:`);
            optimizationAnalysis.optimizationSuggestions.forEach((suggestion, index) => {
                console.log(`   ${index + 1}. ${suggestion}`);
            });
        }
        
        console.log(`\n✅ Workflow optimization analysis completed`);
    }
    
    async testWorkflowCompletenessAnalysis() {
        console.log('\n📋 Testing workflow completeness analysis...');
        
        const workflows = await this.getAllWorkflows();
        const completenessAnalysis = {
            totalWorkflows: workflows.length,
            completeWorkflows: 0,
            incompleteWorkflows: 0,
            completenessIssues: []
        };
        
        workflows.forEach(workflow => {
            const completenessScore = this.analyzeWorkflowCompleteness(workflow);
            
            if (completenessScore.score >= 90) {
                completenessAnalysis.completeWorkflows++;
                console.log(`   ✅ ${workflow.operationName} - Complete (${completenessScore.score}/100)`);
            } else {
                completenessAnalysis.incompleteWorkflows++;
                console.log(`   ⚠️  ${workflow.operationName} - Incomplete (${completenessScore.score}/100)`);
                completenessAnalysis.completenessIssues.push(...completenessScore.issues);
            }
        });
        
        console.log(`\n📊 Completeness Analysis Summary:`);
        console.log(`   Total Workflows: ${completenessAnalysis.totalWorkflows}`);
        console.log(`   Complete Workflows: ${completenessAnalysis.completeWorkflows}`);
        console.log(`   Incomplete Workflows: ${completenessAnalysis.incompleteWorkflows}`);
        console.log(`   Completeness Rate: ${((completenessAnalysis.completeWorkflows / completenessAnalysis.totalWorkflows) * 100).toFixed(1)}%`);
        
        if (completenessAnalysis.completenessIssues.length > 0) {
            console.log(`\n⚠️  Completeness Issues:`);
            completenessAnalysis.completenessIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        // Completeness threshold: at least 90% of workflows should be complete
        const completenessThreshold = 90;
        const completenessRate = (completenessAnalysis.completeWorkflows / completenessAnalysis.totalWorkflows) * 100;
        
        if (completenessRate < completenessThreshold) {
            throw new Error(`Completeness rate ${completenessRate.toFixed(1)}% is below threshold ${completenessThreshold}%`);
        }
        
        console.log(`\n✅ Workflow completeness analysis completed`);
    }
    
    async testWorkflowConsistencyAnalysis() {
        console.log('\n📋 Testing workflow consistency analysis...');
        
        const workflows = await this.getAllWorkflows();
        const consistencyAnalysis = {
            totalChecks: 0,
            consistentChecks: 0,
            inconsistentChecks: 0,
            consistencyIssues: []
        };
        
        // Check consistency across workflows
        const consistencyChecks = [
            {
                name: 'Role naming consistency',
                check: () => this.checkRoleNamingConsistency(workflows)
            },
            {
                name: 'Function naming consistency',
                check: () => this.checkFunctionNamingConsistency(workflows)
            },
            {
                name: 'Action type consistency',
                check: () => this.checkActionTypeConsistency(workflows)
            },
            {
                name: 'Phase type consistency',
                check: () => this.checkPhaseTypeConsistency(workflows)
            },
            {
                name: 'Workflow type consistency',
                check: () => this.checkWorkflowTypeConsistency(workflows)
            }
        ];
        
        consistencyChecks.forEach(check => {
            consistencyAnalysis.totalChecks++;
            
            try {
                const result = check.check();
                if (result.isConsistent) {
                    consistencyAnalysis.consistentChecks++;
                    console.log(`   ✅ ${check.name} - Consistent`);
                } else {
                    consistencyAnalysis.inconsistentChecks++;
                    console.log(`   ❌ ${check.name} - Inconsistent`);
                    consistencyAnalysis.consistencyIssues.push(...result.issues);
                }
            } catch (error) {
                consistencyAnalysis.inconsistentChecks++;
                console.log(`   ❌ ${check.name} - Error: ${error.message}`);
                consistencyAnalysis.consistencyIssues.push(`${check.name}: ${error.message}`);
            }
        });
        
        console.log(`\n📊 Consistency Analysis Summary:`);
        console.log(`   Total Checks: ${consistencyAnalysis.totalChecks}`);
        console.log(`   Consistent Checks: ${consistencyAnalysis.consistentChecks}`);
        console.log(`   Inconsistent Checks: ${consistencyAnalysis.inconsistentChecks}`);
        console.log(`   Consistency Rate: ${((consistencyAnalysis.consistentChecks / consistencyAnalysis.totalChecks) * 100).toFixed(1)}%`);
        
        if (consistencyAnalysis.consistencyIssues.length > 0) {
            console.log(`\n⚠️  Consistency Issues:`);
            consistencyAnalysis.consistencyIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        // Consistency threshold: at least 80% of checks should be consistent
        const consistencyThreshold = 80;
        const consistencyRate = (consistencyAnalysis.consistentChecks / consistencyAnalysis.totalChecks) * 100;
        
        if (consistencyRate < consistencyThreshold) {
            throw new Error(`Consistency rate ${consistencyRate.toFixed(1)}% is below threshold ${consistencyThreshold}%`);
        }
        
        console.log(`\n✅ Workflow consistency analysis completed`);
    }
    
    async testWorkflowScalabilityAnalysis() {
        console.log('\n📋 Testing workflow scalability analysis...');
        
        const workflows = await this.getAllWorkflows();
        const scalabilityAnalysis = {
            totalWorkflows: workflows.length,
            scalableWorkflows: 0,
            nonScalableWorkflows: 0,
            scalabilityIssues: []
        };
        
        workflows.forEach(workflow => {
            const scalabilityScore = this.analyzeWorkflowScalability(workflow);
            
            if (scalabilityScore.score >= 75) {
                scalabilityAnalysis.scalableWorkflows++;
                console.log(`   ✅ ${workflow.operationName} - Scalable (${scalabilityScore.score}/100)`);
            } else {
                scalabilityAnalysis.nonScalableWorkflows++;
                console.log(`   ⚠️  ${workflow.operationName} - Scalability concerns (${scalabilityScore.score}/100)`);
                scalabilityAnalysis.scalabilityIssues.push(...scalabilityScore.issues);
            }
        });
        
        console.log(`\n📊 Scalability Analysis Summary:`);
        console.log(`   Total Workflows: ${scalabilityAnalysis.totalWorkflows}`);
        console.log(`   Scalable Workflows: ${scalabilityAnalysis.scalableWorkflows}`);
        console.log(`   Non-Scalable Workflows: ${scalabilityAnalysis.nonScalableWorkflows}`);
        console.log(`   Scalability Rate: ${((scalabilityAnalysis.scalableWorkflows / scalabilityAnalysis.totalWorkflows) * 100).toFixed(1)}%`);
        
        if (scalabilityAnalysis.scalabilityIssues.length > 0) {
            console.log(`\n⚠️  Scalability Issues:`);
            scalabilityAnalysis.scalabilityIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        console.log(`\n✅ Workflow scalability analysis completed`);
    }
    
    async testWorkflowMaintainabilityAnalysis() {
        console.log('\n📋 Testing workflow maintainability analysis...');
        
        const workflows = await this.getAllWorkflows();
        const maintainabilityAnalysis = {
            totalWorkflows: workflows.length,
            maintainableWorkflows: 0,
            nonMaintainableWorkflows: 0,
            maintainabilityIssues: []
        };
        
        workflows.forEach(workflow => {
            const maintainabilityScore = this.analyzeWorkflowMaintainability(workflow);
            
            if (maintainabilityScore.score >= 80) {
                maintainabilityAnalysis.maintainableWorkflows++;
                console.log(`   ✅ ${workflow.operationName} - Maintainable (${maintainabilityScore.score}/100)`);
            } else {
                maintainabilityAnalysis.nonMaintainableWorkflows++;
                console.log(`   ⚠️  ${workflow.operationName} - Maintainability concerns (${maintainabilityScore.score}/100)`);
                maintainabilityAnalysis.maintainabilityIssues.push(...maintainabilityScore.issues);
            }
        });
        
        console.log(`\n📊 Maintainability Analysis Summary:`);
        console.log(`   Total Workflows: ${maintainabilityAnalysis.totalWorkflows}`);
        console.log(`   Maintainable Workflows: ${maintainabilityAnalysis.maintainableWorkflows}`);
        console.log(`   Non-Maintainable Workflows: ${maintainabilityAnalysis.nonMaintainableWorkflows}`);
        console.log(`   Maintainability Rate: ${((maintainabilityAnalysis.maintainableWorkflows / maintainabilityAnalysis.totalWorkflows) * 100).toFixed(1)}%`);
        
        if (maintainabilityAnalysis.maintainabilityIssues.length > 0) {
            console.log(`\n⚠️  Maintainability Issues:`);
            maintainabilityAnalysis.maintainabilityIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        console.log(`\n✅ Workflow maintainability analysis completed`);
    }
    
    // Helper methods for analysis
    analyzePathSecurity(path) {
        let score = 100;
        const issues = [];
        
        // Check for security best practices
        if (!path.requiresSignature && path.hasOffChainPhase) {
            score -= 20;
            issues.push('Meta-transaction path without signature requirement');
        }
        
        if (path.estimatedTimeSec === 0 && path.workflowType === 0) {
            score -= 15;
            issues.push('Time-delay path with immediate execution');
        }
        
        const offChainSteps = path.steps.filter(step => step.isOffChain);
        const onChainSteps = path.steps.filter(step => !step.isOffChain);
        
        if (offChainSteps.length > 0 && onChainSteps.length === 0) {
            score -= 25;
            issues.push('Path with only off-chain steps');
        }
        
        return { score: Math.max(0, score), issues };
    }
    
    analyzePathOptimization(path) {
        let score = 100;
        const suggestions = [];
        
        // Check for optimization opportunities
        if (path.steps.length > 5) {
            score -= 10;
            suggestions.push('Consider reducing number of steps');
        }
        
        if (path.estimatedTimeSec > 86400) {
            score -= 15;
            suggestions.push('Consider reducing time delay');
        }
        
        const duplicateSteps = this.findDuplicateSteps(path.steps);
        if (duplicateSteps.length > 0) {
            score -= 20;
            suggestions.push('Remove duplicate steps');
        }
        
        return { score: Math.max(0, score), suggestions };
    }
    
    analyzeWorkflowCompleteness(workflow) {
        let score = 100;
        const issues = [];
        
        // Check completeness criteria
        if (workflow.paths.length === 0) {
            score -= 50;
            issues.push('No workflow paths defined');
        }
        
        if (workflow.supportedRoles.length === 0) {
            score -= 20;
            issues.push('No supported roles defined');
        }
        
        const hasTimeDelayPath = workflow.paths.some(path => path.workflowType === 0);
        const hasMetaTxPath = workflow.paths.some(path => path.hasOffChainPhase);
        
        if (!hasTimeDelayPath && !hasMetaTxPath) {
            score -= 30;
            issues.push('No time-delay or meta-transaction paths');
        }
        
        return { score: Math.max(0, score), issues };
    }
    
    analyzeWorkflowScalability(workflow) {
        let score = 100;
        const issues = [];
        
        // Check scalability criteria
        if (workflow.paths.length > 10) {
            score -= 15;
            issues.push('Too many workflow paths');
        }
        
        const totalSteps = workflow.paths.reduce((sum, path) => sum + path.steps.length, 0);
        if (totalSteps > 50) {
            score -= 20;
            issues.push('Too many total steps');
        }
        
        const avgStepsPerPath = totalSteps / workflow.paths.length;
        if (avgStepsPerPath > 5) {
            score -= 10;
            issues.push('Average steps per path too high');
        }
        
        return { score: Math.max(0, score), issues };
    }
    
    analyzeWorkflowMaintainability(workflow) {
        let score = 100;
        const issues = [];
        
        // Check maintainability criteria
        if (workflow.operationName.length > 50) {
            score -= 10;
            issues.push('Operation name too long');
        }
        
        const hasDescriptions = workflow.paths.every(path => path.description && path.description.length > 10);
        if (!hasDescriptions) {
            score -= 15;
            issues.push('Missing or insufficient descriptions');
        }
        
        const hasStepDescriptions = workflow.paths.every(path => 
            path.steps.every(step => step.description && step.description.length > 5)
        );
        if (!hasStepDescriptions) {
            score -= 20;
            issues.push('Missing or insufficient step descriptions');
        }
        
        return { score: Math.max(0, score), issues };
    }
    
    findDuplicateSteps(steps) {
        const duplicates = [];
        const seen = new Set();
        
        steps.forEach((step, index) => {
            const key = `${step.functionName}-${step.action}`;
            if (seen.has(key)) {
                duplicates.push({ step, index });
            } else {
                seen.add(key);
            }
        });
        
        return duplicates;
    }
    
    // Consistency check methods
    checkRoleNamingConsistency(workflows) {
        const validRoles = ['OWNER', 'BROADCASTER', 'RECOVERY'];
        const issues = [];
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    step.roles.forEach(role => {
                        if (!validRoles.includes(role)) {
                            issues.push(`Invalid role: ${role} in ${workflow.operationName}`);
                        }
                    });
                });
            });
        });
        
        return { isConsistent: issues.length === 0, issues };
    }
    
    checkFunctionNamingConsistency(workflows) {
        const issues = [];
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    if (!step.functionName || step.functionName.length < 3) {
                        issues.push(`Invalid function name: ${step.functionName} in ${workflow.operationName}`);
                    }
                });
            });
        });
        
        return { isConsistent: issues.length === 0, issues };
    }
    
    checkActionTypeConsistency(workflows) {
        const validActions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const issues = [];
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    if (!validActions.includes(step.action)) {
                        issues.push(`Invalid action type: ${step.action} in ${workflow.operationName}`);
                    }
                });
            });
        });
        
        return { isConsistent: issues.length === 0, issues };
    }
    
    checkPhaseTypeConsistency(workflows) {
        const validPhaseTypes = ['SIGNING', 'EXECUTION'];
        const issues = [];
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                path.steps.forEach(step => {
                    if (!validPhaseTypes.includes(step.phaseType)) {
                        issues.push(`Invalid phase type: ${step.phaseType} in ${workflow.operationName}`);
                    }
                });
            });
        });
        
        return { isConsistent: issues.length === 0, issues };
    }
    
    checkWorkflowTypeConsistency(workflows) {
        const validWorkflowTypes = [0, 1, 2, 3];
        const issues = [];
        
        workflows.forEach(workflow => {
            workflow.paths.forEach(path => {
                if (!validWorkflowTypes.includes(path.workflowType)) {
                    issues.push(`Invalid workflow type: ${path.workflowType} in ${workflow.operationName}`);
                }
            });
        });
        
        return { isConsistent: issues.length === 0, issues };
    }
}

module.exports = WorkflowAnalysisTests;
