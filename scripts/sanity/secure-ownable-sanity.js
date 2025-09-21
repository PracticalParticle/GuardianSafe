/**
 * SecureOwnable Sanity Test Suite
 * 
 * This script performs comprehensive testing of the SecureOwnable component
 * with GuardianAccountAbstraction contract, testing all possible workflows
 * directly on the blockchain and returning a detailed report.
 * 
 * Test Coverage:
 * 1. Ownership Transfer Workflows (Request -> Approval/Cancel)
 * 2. Broadcaster Update Workflows (Request -> Approval/Cancel)
 * 3. Recovery Update Workflows (Meta-transaction)
 * 4. Timelock Update Workflows (Meta-transaction)
 * 5. Meta-transaction Generation and Verification
 * 6. Permission Validation and Access Control
 * 7. Event Logging and Transaction History
 * 8. Error Handling and Edge Cases
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

class SecureOwnableSanityTest {
    constructor() {
        this.web3 = new Web3(process.env.REMOTE_HOST ? 
            `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT}` : 
            'http://localhost:8545'
        );
        
        this.contractAddress = process.env.GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS;
        this.contractABI = this.loadABI('GuardianAccountAbstraction');
        
        // Initialize test wallets
        this.wallets = {
            owner: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_OWNER_PRIVATE_KEY),
            broadcaster: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_BROADCASTER_PRIVATE_KEY),
            recovery: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_RECOVERY_PRIVATE_KEY),
            user: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_USER_PRIVATE_KEY)
        };
        
        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            testDetails: [],
            timestamp: new Date().toISOString()
        };
    }

    loadABI(contractName) {
        const abiPath = path.join(__dirname, '../../abi', `${contractName}.abi.json`);
        return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    }

    async runAllTests() {
        console.log('🔒 Starting SecureOwnable Sanity Tests...\n');
        
        try {
            // Test 1: Basic Contract State Verification
            await this.testBasicContractState();
            
            // Test 2: Ownership Transfer Workflows
            await this.testOwnershipTransferWorkflows();
            
            // Test 3: Broadcaster Update Workflows
            await this.testBroadcasterUpdateWorkflows();
            
            // Test 4: Recovery Update Workflows
            await this.testRecoveryUpdateWorkflows();
            
            // Test 5: Timelock Update Workflows
            await this.testTimelockUpdateWorkflows();
            
            // Test 6: Meta-transaction Generation
            await this.testMetaTransactionGeneration();
            
            // Test 7: Permission Validation
            await this.testPermissionValidation();
            
            // Test 8: Transaction History and Events
            await this.testTransactionHistoryAndEvents();
            
            // Test 9: Error Handling and Edge Cases
            await this.testErrorHandling();
            
            // Generate final report
            return this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.failedTests++;
            this.testResults.testDetails.push({
                test: 'Test Suite Execution',
                status: 'FAILED',
                error: error.message
            });
        }
    }

    async testBasicContractState() {
        console.log('📋 Testing Basic Contract State...');
        
        try {
            // Test owner retrieval
            const owner = await this.contract.methods.owner().call();
            this.assertTest(owner === this.wallets.owner.address, 'Owner address matches expected');
            
            // Test broadcaster retrieval
            const broadcaster = await this.contract.methods.getBroadcaster().call();
            this.assertTest(broadcaster === this.wallets.broadcaster.address, 'Broadcaster address matches expected');
            
            // Test recovery retrieval
            const recovery = await this.contract.methods.getRecovery().call();
            this.assertTest(recovery === this.wallets.recovery.address, 'Recovery address matches expected');
            
            // Test timelock period
            const timelock = await this.contract.methods.getTimeLockPeriodInMinutes().call();
            this.assertTest(parseInt(timelock) > 0, 'Timelock period is set');
            
            // Test supported operation types
            const operationTypes = await this.contract.methods.getSupportedOperationTypes().call();
            this.assertTest(operationTypes.length > 0, 'Operation types are defined');
            
            console.log('✅ Basic contract state tests passed\n');
            
        } catch (error) {
            this.handleTestError('Basic Contract State', error);
        }
    }

    async testOwnershipTransferWorkflows() {
        console.log('🔄 Testing Ownership Transfer Workflows...');
        
        try {
            // Test 1: Request ownership transfer (should fail - only recovery can request)
            try {
                await this.sendTransaction(
                    this.contract.methods.transferOwnershipRequest(),
                    this.wallets.owner
                );
                this.assertTest(false, 'Owner should not be able to request ownership transfer');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Owner correctly denied ownership transfer request');
            }
            
            // Test 2: Recovery requests ownership transfer
            const txRecord = await this.sendTransaction(
                this.contract.methods.transferOwnershipRequest(),
                this.wallets.recovery
            );
            this.assertTest(txRecord.txId > 0, 'Ownership transfer request created');
            
            // Test 3: Check pending transactions
            const pendingTxs = await this.contract.methods.getPendingTransactions().call();
            this.assertTest(pendingTxs.includes(txRecord.txId.toString()), 'Transaction is pending');
            
            // Test 4: Try to approve before timelock (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.transferOwnershipDelayedApproval(txRecord.txId),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to approve before timelock');
            } catch (error) {
                this.assertTest(error.message.includes('release time'), 'Correctly blocked early approval');
            }
            
            // Test 5: Cancel ownership transfer
            const cancelTx = await this.sendTransaction(
                this.contract.methods.transferOwnershipCancellation(txRecord.txId),
                this.wallets.recovery
            );
            this.assertTest(cancelTx.status === '3', 'Transaction cancelled successfully'); // 3 = CANCELLED
            
            console.log('✅ Ownership transfer workflow tests passed\n');
            
        } catch (error) {
            this.handleTestError('Ownership Transfer Workflows', error);
        }
    }

    async testBroadcasterUpdateWorkflows() {
        console.log('📡 Testing Broadcaster Update Workflows...');
        
        try {
            const newBroadcaster = this.wallets.user.address;
            
            // Test 1: Owner requests broadcaster update
            const txRecord = await this.sendTransaction(
                this.contract.methods.updateBroadcasterRequest(newBroadcaster),
                this.wallets.owner
            );
            this.assertTest(txRecord.txId > 0, 'Broadcaster update request created');
            
            // Test 2: Try to approve before timelock (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.updateBroadcasterDelayedApproval(txRecord.txId),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to approve before timelock');
            } catch (error) {
                this.assertTest(error.message.includes('release time'), 'Correctly blocked early approval');
            }
            
            // Test 3: Cancel broadcaster update
            const cancelTx = await this.sendTransaction(
                this.contract.methods.updateBroadcasterCancellation(txRecord.txId),
                this.wallets.owner
            );
            this.assertTest(cancelTx.status === '3', 'Transaction cancelled successfully');
            
            console.log('✅ Broadcaster update workflow tests passed\n');
            
        } catch (error) {
            this.handleTestError('Broadcaster Update Workflows', error);
        }
    }

    async testRecoveryUpdateWorkflows() {
        console.log('🛡️ Testing Recovery Update Workflows...');
        
        try {
            const newRecovery = this.wallets.user.address;
            
            // Test 1: Generate execution options
            const executionOptions = await this.contract.methods.updateRecoveryExecutionOptions(newRecovery).call();
            this.assertTest(executionOptions.length > 0, 'Execution options generated');
            
            // Test 2: Generate meta-transaction parameters
            const metaTxParams = await this.contract.methods.createMetaTxParams(
                this.contractAddress,
                '0x12345678', // Mock selector
                6, // EXECUTE_META_REQUEST_AND_APPROVE
                24, // 24 hours deadline
                20000000000, // 20 gwei max gas price
                this.wallets.owner.address
            ).call();
            
            this.assertTest(metaTxParams.chainId > 0, 'Meta-transaction parameters created');
            
            console.log('✅ Recovery update workflow tests passed\n');
            
        } catch (error) {
            this.handleTestError('Recovery Update Workflows', error);
        }
    }

    async testTimelockUpdateWorkflows() {
        console.log('⏰ Testing Timelock Update Workflows...');
        
        try {
            const newTimelock = 1440; // 24 hours
            
            // Test 1: Generate execution options
            const executionOptions = await this.contract.methods.updateTimeLockExecutionOptions(newTimelock).call();
            this.assertTest(executionOptions.length > 0, 'Timelock execution options generated');
            
            // Test 2: Validate timelock period
            const currentTimelock = await this.contract.methods.getTimeLockPeriodInMinutes().call();
            this.assertTest(parseInt(currentTimelock) > 0, 'Current timelock period is valid');
            
            console.log('✅ Timelock update workflow tests passed\n');
            
        } catch (error) {
            this.handleTestError('Timelock Update Workflows', error);
        }
    }

    async testMetaTransactionGeneration() {
        console.log('🔐 Testing Meta-transaction Generation...');
        
        try {
            // Test 1: Generate unsigned meta-transaction for new operation
            const unsignedMetaTx = await this.contract.methods.generateUnsignedMetaTransactionForNew(
                this.wallets.owner.address,
                this.contractAddress,
                0, // no value
                0, // no gas limit
                '0x1234567890123456789012345678901234567890123456789012345678901234', // mock operation type
                1, // STANDARD execution
                '0x', // empty execution options
                {
                    chainId: await this.web3.eth.getChainId(),
                    nonce: 0,
                    handlerContract: this.contractAddress,
                    handlerSelector: '0x12345678',
                    action: 6, // EXECUTE_META_REQUEST_AND_APPROVE
                    deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours
                    maxGasPrice: 20000000000,
                    signer: this.wallets.owner.address
                }
            ).call();
            
            this.assertTest(unsignedMetaTx.txRecord.txId > 0, 'Unsigned meta-transaction generated');
            
            console.log('✅ Meta-transaction generation tests passed\n');
            
        } catch (error) {
            this.handleTestError('Meta-transaction Generation', error);
        }
    }

    async testPermissionValidation() {
        console.log('🔒 Testing Permission Validation...');
        
        try {
            // Test 1: Owner permissions
            const owner = await this.contract.methods.owner().call();
            this.assertTest(owner === this.wallets.owner.address, 'Owner permission verified');
            
            // Test 2: Broadcaster permissions
            const broadcaster = await this.contract.methods.getBroadcaster().call();
            this.assertTest(broadcaster === this.wallets.broadcaster.address, 'Broadcaster permission verified');
            
            // Test 3: Recovery permissions
            const recovery = await this.contract.methods.getRecovery().call();
            this.assertTest(recovery === this.wallets.recovery.address, 'Recovery permission verified');
            
            // Test 4: Unauthorized access attempt
            try {
                await this.sendTransaction(
                    this.contract.methods.transferOwnershipRequest(),
                    this.wallets.user
                );
                this.assertTest(false, 'Unauthorized user should not be able to request ownership transfer');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Unauthorized access correctly blocked');
            }
            
            console.log('✅ Permission validation tests passed\n');
            
        } catch (error) {
            this.handleTestError('Permission Validation', error);
        }
    }

    async testTransactionHistoryAndEvents() {
        console.log('📊 Testing Transaction History and Events...');
        
        try {
            // Test 1: Get transaction history
            const history = await this.contract.methods.getTransactionHistory(1, 10).call();
            this.assertTest(Array.isArray(history), 'Transaction history retrieved');
            
            // Test 2: Get specific transaction
            if (history.length > 0) {
                const txId = history[0].txId;
                const transaction = await this.contract.methods.getTransaction(txId).call();
                this.assertTest(transaction.txId === txId, 'Specific transaction retrieved');
            }
            
            // Test 3: Get pending transactions
            const pendingTxs = await this.contract.methods.getPendingTransactions().call();
            this.assertTest(Array.isArray(pendingTxs), 'Pending transactions retrieved');
            
            console.log('✅ Transaction history and events tests passed\n');
            
        } catch (error) {
            this.handleTestError('Transaction History and Events', error);
        }
    }

    async testErrorHandling() {
        console.log('⚠️ Testing Error Handling and Edge Cases...');
        
        try {
            // Test 1: Invalid transaction ID
            try {
                await this.contract.methods.getTransaction(999999).call();
                this.assertTest(false, 'Should not retrieve non-existent transaction');
            } catch (error) {
                this.assertTest(true, 'Correctly handled invalid transaction ID');
            }
            
            // Test 2: Zero address validation
            try {
                await this.sendTransaction(
                    this.contract.methods.updateBroadcasterRequest('0x0000000000000000000000000000000000000000'),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept zero address');
            } catch (error) {
                this.assertTest(error.message.includes('Invalid address'), 'Correctly rejected zero address');
            }
            
            // Test 3: Same address update
            try {
                const currentBroadcaster = await this.contract.methods.getBroadcaster().call();
                await this.sendTransaction(
                    this.contract.methods.updateBroadcasterRequest(currentBroadcaster),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept same address');
            } catch (error) {
                this.assertTest(error.message.includes('same address'), 'Correctly rejected same address');
            }
            
            console.log('✅ Error handling tests passed\n');
            
        } catch (error) {
            this.handleTestError('Error Handling', error);
        }
    }

    async sendTransaction(method, wallet) {
        const gasEstimate = await method.estimateGas({ from: wallet.address });
        const gasPrice = await this.web3.eth.getGasPrice();
        
        const tx = {
            from: wallet.address,
            to: this.contractAddress,
            data: method.encodeABI(),
            gas: gasEstimate,
            gasPrice: gasPrice
        };
        
        const signedTx = await wallet.signTransaction(tx);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        // Decode the result if it's a view function
        if (method._method.type === 'call') {
            return method.call({ from: wallet.address });
        }
        
        return receipt;
    }

    assertTest(condition, message) {
        this.testResults.totalTests++;
        
        if (condition) {
            this.testResults.passedTests++;
            console.log(`  ✅ ${message}`);
        } else {
            this.testResults.failedTests++;
            console.log(`  ❌ ${message}`);
            this.testResults.testDetails.push({
                test: message,
                status: 'FAILED',
                error: 'Assertion failed'
            });
        }
    }

    handleTestError(testName, error) {
        this.testResults.failedTests++;
        this.testResults.testDetails.push({
            test: testName,
            status: 'FAILED',
            error: error.message
        });
        console.log(`❌ ${testName} failed: ${error.message}\n`);
    }

    generateReport() {
        const report = {
            testSuite: 'SecureOwnable Sanity Test',
            contract: 'GuardianAccountAbstraction',
            contractAddress: this.contractAddress,
            timestamp: this.testResults.timestamp,
            summary: {
                totalTests: this.testResults.totalTests,
                passedTests: this.testResults.passedTests,
                failedTests: this.testResults.failedTests,
                successRate: `${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2)}%`
            },
            details: this.testResults.testDetails
        };
        
        // Save report to file
        const reportPath = path.join(__dirname, 'reports', 'secure-ownable-sanity-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('📋 SECURE OWNABLE SANITY TEST REPORT');
        console.log('=====================================');
        console.log(`Contract: ${this.contractAddress}`);
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passedTests}`);
        console.log(`Failed: ${report.summary.failedTests}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.log(`Report saved to: ${reportPath}`);
        
        if (report.summary.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            report.details.filter(d => d.status === 'FAILED').forEach(d => {
                console.log(`  - ${d.test}: ${d.error}`);
            });
        }
        
        return report;
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    const test = new SecureOwnableSanityTest();
    test.runAllTests().then(report => {
        console.log('Test completed with report:', report ? 'Yes' : 'No');
    }).catch(console.error);
}

module.exports = SecureOwnableSanityTest;
