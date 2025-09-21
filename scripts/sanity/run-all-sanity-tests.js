/**
 * Master Sanity Test Runner
 * 
 * This script runs all sanity tests in sequence and generates a comprehensive report
 * covering all components of the Guardian protocol framework.
 */

const SecureOwnableSanityTest = require('./secure-ownable-sanity');
const DynamicRBACSanityTest = require('./rbac-sanity');
const SimpleVaultSanityTest = require('./vault-sanity');
const SimpleRWA20SanityTest = require('./rwa20-sanity');
const fs = require('fs');
const path = require('path');

class MasterSanityTestRunner {
    constructor() {
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            componentResults: [],
            timestamp: new Date().toISOString(),
            overallSuccess: false
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Guardian Protocol Master Sanity Test Suite...\n');
        console.log('=' .repeat(60));
        
        const testSuites = [
            {
                name: 'SecureOwnable Component',
                description: 'Testing SecureOwnable with GuardianAccountAbstraction',
                testClass: SecureOwnableSanityTest,
                contract: 'GuardianAccountAbstraction'
            },
            {
                name: 'DynamicRBAC Component',
                description: 'Testing DynamicRBAC with GuardianAccountAbstractionWithRoles',
                testClass: DynamicRBACSanityTest,
                contract: 'GuardianAccountAbstractionWithRoles'
            },
            {
                name: 'SimpleVault Component',
                description: 'Testing SimpleVault custom logic',
                testClass: SimpleVaultSanityTest,
                contract: 'SimpleVault'
            },
            {
                name: 'SimpleRWA20 Component',
                description: 'Testing SimpleRWA20 custom logic',
                testClass: SimpleRWA20SanityTest,
                contract: 'SimpleRWA20'
            }
        ];

        for (const suite of testSuites) {
            console.log(`\n🔧 Running ${suite.name} Tests...`);
            console.log(`📝 ${suite.description}`);
            console.log('-'.repeat(50));
            
            try {
                const testInstance = new suite.testClass();
                const report = await testInstance.runAllTests();
                
                // Check if report exists and has summary
                if (report && report.summary) {
                    this.testResults.componentResults.push({
                        component: suite.name,
                        contract: suite.contract,
                        totalTests: report.summary.totalTests,
                        passedTests: report.summary.passedTests,
                        failedTests: report.summary.failedTests,
                        successRate: report.summary.successRate,
                        status: report.summary.failedTests === 0 ? 'PASSED' : 'FAILED'
                    });
                } else {
                    // Handle case where testInstance.runAllTests() doesn't return a report
                    this.testResults.componentResults.push({
                        component: suite.name,
                        contract: suite.contract,
                        totalTests: 0,
                        passedTests: 0,
                        failedTests: 1,
                        successRate: '0.00%',
                        status: 'FAILED',
                        error: 'Test runner did not return proper report'
                    });
                }
                
                if (report && report.summary) {
                    this.testResults.totalTests += report.summary.totalTests;
                    this.testResults.passedTests += report.summary.passedTests;
                    this.testResults.failedTests += report.summary.failedTests;
                } else {
                    this.testResults.failedTests++;
                }
                
                if (report && report.summary) {
                    console.log(`✅ ${suite.name} completed: ${report.summary.successRate} success rate\n`);
                } else {
                    console.log(`❌ ${suite.name} failed: Test runner did not return proper report\n`);
                }
                
            } catch (error) {
                console.error(`❌ ${suite.name} failed:`, error.message);
                
                this.testResults.componentResults.push({
                    component: suite.name,
                    contract: suite.contract,
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 1,
                    successRate: '0.00%',
                    status: 'FAILED',
                    error: error.message
                });
                
                this.testResults.failedTests++;
            }
        }
        
        // Calculate overall success
        this.testResults.overallSuccess = this.testResults.failedTests === 0;
        
        // Generate master report
        this.generateMasterReport();
        
        return this.testResults;
    }

    generateMasterReport() {
        const report = {
            testSuite: 'Guardian Protocol Master Sanity Test',
            timestamp: this.testResults.timestamp,
            summary: {
                totalTests: this.testResults.totalTests,
                passedTests: this.testResults.passedTests,
                failedTests: this.testResults.failedTests,
                successRate: `${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2)}%`,
                overallStatus: this.testResults.overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
            },
            components: this.testResults.componentResults,
            recommendations: this.generateRecommendations()
        };
        
        // Save master report to file
        const reportPath = path.join(__dirname, 'reports', 'master-sanity-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Display master summary
        console.log('📋 GUARDIAN PROTOCOL MASTER SANITY TEST REPORT');
        console.log('=' .repeat(50));
        console.log(`Overall Status: ${report.summary.overallStatus}`);
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passedTests}`);
        console.log(`Failed: ${report.summary.failedTests}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.log(`Report saved to: ${reportPath}`);
        
        console.log('\n📊 Component Breakdown:');
        report.components.forEach(component => {
            const status = component.status === 'PASSED' ? '✅' : '❌';
            console.log(`  ${status} ${component.component}: ${component.successRate} (${component.passedTests}/${component.totalTests})`);
        });
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`  - ${rec}`);
            });
        }
        
        if (!this.testResults.overallSuccess) {
            console.log('\n❌ Failed Components:');
            report.components.filter(c => c.status === 'FAILED').forEach(component => {
                console.log(`  - ${component.component}: ${component.error || 'See individual test reports'}`);
            });
        }
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze test results and provide recommendations
        const failedComponents = this.testResults.componentResults.filter(c => c.status === 'FAILED');
        
        if (failedComponents.length > 0) {
            recommendations.push('Review failed test components and address underlying issues');
        }
        
        if (this.testResults.failedTests > 0) {
            recommendations.push('Check individual test reports for detailed failure analysis');
        }
        
        if (this.testResults.successRate < '100.00%') {
            recommendations.push('Consider running tests in isolation to identify specific failure points');
        }
        
        // Component-specific recommendations
        const secureOwnableResult = this.testResults.componentResults.find(c => c.component === 'SecureOwnable Component');
        if (secureOwnableResult && secureOwnableResult.status === 'FAILED') {
            recommendations.push('SecureOwnable failures may indicate core security issues - prioritize investigation');
        }
        
        const rbacResult = this.testResults.componentResults.find(c => c.component === 'DynamicRBAC Component');
        if (rbacResult && rbacResult.status === 'FAILED') {
            recommendations.push('DynamicRBAC failures may affect role-based access control - review permissions');
        }
        
        const vaultResult = this.testResults.componentResults.find(c => c.component === 'SimpleVault Component');
        if (vaultResult && vaultResult.status === 'FAILED') {
            recommendations.push('SimpleVault failures may affect asset management - verify withdrawal mechanisms');
        }
        
        const rwa20Result = this.testResults.componentResults.find(c => c.component === 'SimpleRWA20 Component');
        if (rwa20Result && rwa20Result.status === 'FAILED') {
            recommendations.push('SimpleRWA20 failures may affect token operations - check mint/burn functionality');
        }
        
        return recommendations;
    }
}

// Run all tests if this file is executed directly
if (require.main === module) {
    const runner = new MasterSanityTestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = MasterSanityTestRunner;
