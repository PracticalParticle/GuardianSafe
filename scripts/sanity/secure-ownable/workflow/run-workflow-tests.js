/**
 * Workflow Test Runner
 * Executes all workflow tests and provides comprehensive reporting
 */

const WorkflowInformationTests = require('./workflow-information-tests');
const WorkflowExecutionTests = require('./workflow-execution-tests');
const WorkflowIntegrationTests = require('./workflow-integration-tests');
const WorkflowAnalysisTests = require('./workflow-analysis-tests');

class WorkflowTestRunner {
    constructor() {
        this.testSuites = [
            new WorkflowInformationTests(),
            new WorkflowExecutionTests(),
            new WorkflowIntegrationTests(),
            new WorkflowAnalysisTests()
        ];
        
        this.overallResults = {
            totalSuites: 0,
            passedSuites: 0,
            failedSuites: 0,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            errors: []
        };
    }
    
    async runAllTests() {
        console.log('🚀 WORKFLOW FRAMEWORK TEST SUITE');
        console.log('================================');
        console.log('📋 This comprehensive test suite validates the workflow framework:');
        console.log('   • Workflow Information System');
        console.log('   • Workflow Execution Analysis');
        console.log('   • Workflow Integration Testing');
        console.log('   • Workflow Analysis & Quality Metrics');
        console.log('   • Role-based Permission System');
        console.log('   • Off-chain/On-chain Phase Detection');
        console.log('   • Programmatic Workflow Analysis');
        console.log('   • Security & Performance Validation');
        console.log('');
        
        const startTime = Date.now();
        
        for (const testSuite of this.testSuites) {
            await this.runTestSuite(testSuite);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        this.printOverallResults(duration);
    }
    
    async runTestSuite(testSuite) {
        this.overallResults.totalSuites++;
        
        try {
            console.log(`\n🧪 Running Test Suite: ${testSuite.testName}`);
            console.log('='.repeat(50));
            
            await testSuite.executeTests();
            
            // Collect results from test suite
            this.overallResults.totalTests += testSuite.testResults.totalTests;
            this.overallResults.passedTests += testSuite.testResults.passedTests;
            this.overallResults.failedTests += testSuite.testResults.failedTests;
            
            if (testSuite.testResults.failedTests === 0) {
                this.overallResults.passedSuites++;
                console.log(`\n✅ Test Suite PASSED: ${testSuite.testName}`);
            } else {
                this.overallResults.failedSuites++;
                console.log(`\n❌ Test Suite FAILED: ${testSuite.testName}`);
                
                // Add errors to overall results
                testSuite.testResults.errors.forEach(error => {
                    this.overallResults.errors.push({
                        suite: testSuite.testName,
                        test: error.test,
                        error: error.error,
                        stack: error.stack
                    });
                });
            }
            
        } catch (error) {
            this.overallResults.failedSuites++;
            this.overallResults.errors.push({
                suite: testSuite.testName,
                test: 'Suite Execution',
                error: error.message,
                stack: error.stack
            });
            
            console.log(`\n❌ Test Suite ERROR: ${testSuite.testName}`);
            console.log(`   Error: ${error.message}`);
        }
    }
    
    printOverallResults(duration) {
        console.log('\n📊 OVERALL TEST RESULTS');
        console.log('=======================');
        console.log(`Total Test Suites: ${this.overallResults.totalSuites}`);
        console.log(`Passed Suites: ${this.overallResults.passedSuites}`);
        console.log(`Failed Suites: ${this.overallResults.failedSuites}`);
        console.log(`Suite Success Rate: ${((this.overallResults.passedSuites / this.overallResults.totalSuites) * 100).toFixed(1)}%`);
        console.log('');
        console.log(`Total Tests: ${this.overallResults.totalTests}`);
        console.log(`Passed Tests: ${this.overallResults.passedTests}`);
        console.log(`Failed Tests: ${this.overallResults.failedTests}`);
        console.log(`Test Success Rate: ${((this.overallResults.passedTests / this.overallResults.totalTests) * 100).toFixed(1)}%`);
        console.log('');
        console.log(`Total Duration: ${(duration / 1000).toFixed(2)} seconds`);
        
        if (this.overallResults.errors.length > 0) {
            console.log('\n❌ FAILED TESTS DETAILS:');
            console.log('========================');
            
            this.overallResults.errors.forEach((error, index) => {
                console.log(`\n${index + 1}. Suite: ${error.suite}`);
                console.log(`   Test: ${error.test}`);
                console.log(`   Error: ${error.error}`);
            });
        }
        
        // Print summary
        if (this.overallResults.failedTests === 0) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('✅ Workflow framework is working correctly');
            console.log('✅ All workflow information is accurate');
            console.log('✅ Role-based permissions are properly implemented');
            console.log('✅ Off-chain/on-chain phases are correctly detected');
            console.log('✅ Programmatic workflow analysis is functional');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED');
            console.log('❌ Please review the failed tests above');
            console.log('❌ Workflow framework may need fixes');
        }
        
        // Print next steps
        console.log('\n📋 NEXT STEPS:');
        console.log('==============');
        if (this.overallResults.failedTests === 0) {
            console.log('• Workflow framework is ready for production use');
            console.log('• Frontend applications can safely use workflow information');
            console.log('• SDK can implement role-based permission checking');
            console.log('• Testing frameworks can generate dynamic test cases');
        } else {
            console.log('• Review and fix failed tests');
            console.log('• Verify contract deployment and configuration');
            console.log('• Check environment variables and network connectivity');
            console.log('• Re-run tests after fixes');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new WorkflowTestRunner();
    runner.runAllTests().catch(error => {
        console.error('❌ Test runner failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    });
}

module.exports = WorkflowTestRunner;
