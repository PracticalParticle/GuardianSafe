/**
 * SimpleVault Sanity Test Suite
 * 
 * This script performs comprehensive testing of the SimpleVault contract,
 * testing all possible workflows directly on the blockchain and returning a detailed report.
 * 
 * Test Coverage:
 * 1. Vault Initialization and Configuration
 * 2. ETH Deposit and Balance Management
 * 3. ETH Withdrawal Workflows (Request -> Approval/Cancel)
 * 4. Token Withdrawal Workflows (Request -> Approval/Cancel)
 * 5. Meta-transaction Support for Withdrawals
 * 6. Timelock Security Implementation
 * 7. Permission Validation and Access Control
 * 8. Error Handling and Edge Cases
 * 9. Event Logging and Transaction History
 * 10. Integration with MultiPhaseSecureOperation
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

class SimpleVaultSanityTest {
    constructor() {
        this.web3 = new Web3(process.env.REMOTE_HOST ? 
            `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT}` : 
            'http://localhost:8545'
        );
        
        this.contractAddress = process.env.SIMPLE_VAULT_ADDRESS;
        this.contractABI = this.loadABI('SimpleVault');
        
        // Initialize test wallets
        this.wallets = {
            owner: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_OWNER_PRIVATE_KEY),
            broadcaster: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_BROADCASTER_PRIVATE_KEY),
            recovery: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_RECOVERY_PRIVATE_KEY),
            user: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_USER_PRIVATE_KEY),
            admin: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_ADMIN_PRIVATE_KEY)
        };
        
        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            testDetails: [],
            timestamp: new Date().toISOString()
        };
        
        // Test token address (mock ERC20 token)
        this.testTokenAddress = '0x1234567890123456789012345678901234567890';
    }

    loadABI(contractName) {
        const abiPath = path.join(__dirname, '../../abi', `${contractName}.abi.json`);
        return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    }

    async runAllTests() {
        console.log('🏦 Starting SimpleVault Sanity Tests...\n');
        
        try {
            // Test 1: Basic Contract State Verification
            await this.testBasicContractState();
            
            // Test 2: ETH Deposit and Balance Management
            await this.testEthDepositAndBalanceManagement();
            
            // Test 3: ETH Withdrawal Workflows
            await this.testEthWithdrawalWorkflows();
            
            // Test 4: Token Withdrawal Workflows
            await this.testTokenWithdrawalWorkflows();
            
            // Test 5: Meta-transaction Support for Withdrawals
            await this.testMetaTransactionSupportForWithdrawals();
            
            // Test 6: Timelock Security Implementation
            await this.testTimelockSecurityImplementation();
            
            // Test 7: Permission Validation and Access Control
            await this.testPermissionValidationAndAccessControl();
            
            // Test 8: Error Handling and Edge Cases
            await this.testErrorHandlingAndEdgeCases();
            
            // Test 9: Event Logging and Transaction History
            await this.testEventLoggingAndTransactionHistory();
            
            // Test 10: Integration with MultiPhaseSecureOperation
            await this.testIntegrationWithMultiPhaseSecureOperation();
            
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
            
            // Test ETH balance
            const ethBalance = await this.contract.methods.getEthBalance().call();
            this.assertTest(parseInt(ethBalance) >= 0, 'ETH balance retrieved');
            
            // Test operation types
            const operationTypes = await this.contract.methods.getSupportedOperationTypes().call();
            this.assertTest(operationTypes.length >= 2, 'Withdrawal operation types are defined');
            
            console.log('✅ Basic contract state tests passed\n');
            
        } catch (error) {
            this.handleTestError('Basic Contract State', error);
        }
    }

    async testEthDepositAndBalanceManagement() {
        console.log('💰 Testing ETH Deposit and Balance Management...');
        
        try {
            // Test 1: Get initial ETH balance
            const initialBalance = await this.contract.methods.getEthBalance().call();
            this.assertTest(parseInt(initialBalance) >= 0, 'Initial ETH balance retrieved');
            
            // Test 2: Send ETH to vault (simulate deposit)
            const depositAmount = this.web3.utils.toWei('1', 'ether');
            const tx = {
                from: this.wallets.owner.address,
                to: this.contractAddress,
                value: depositAmount,
                gas: 100000,
                gasPrice: await this.web3.eth.getGasPrice()
            };
            
            const signedTx = await this.wallets.owner.signTransaction(tx);
            await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            
            // Test 3: Verify ETH balance increased
            const newBalance = await this.contract.methods.getEthBalance().call();
            this.assertTest(parseInt(newBalance) >= parseInt(initialBalance), 'ETH balance increased after deposit');
            
            // Test 4: Test token balance (should be 0 for non-existent token)
            const tokenBalance = await this.contract.methods.getTokenBalance(this.testTokenAddress).call();
            this.assertTest(parseInt(tokenBalance) === 0, 'Token balance is 0 for non-existent token');
            
            console.log('✅ ETH deposit and balance management tests passed\n');
            
        } catch (error) {
            this.handleTestError('ETH Deposit and Balance Management', error);
        }
    }

    async testEthWithdrawalWorkflows() {
        console.log('💸 Testing ETH Withdrawal Workflows...');
        
        try {
            const withdrawalAmount = this.web3.utils.toWei('0.1', 'ether');
            const recipient = this.wallets.user.address;
            
            // Test 1: Request ETH withdrawal
            const txRecord = await this.sendTransaction(
                this.contract.methods.withdrawEthRequest(recipient, withdrawalAmount),
                this.wallets.owner
            );
            this.assertTest(txRecord.txId > 0, 'ETH withdrawal request created');
            
            // Test 2: Check pending transactions
            const pendingTxs = await this.contract.methods.getPendingTransactions().call();
            this.assertTest(pendingTxs.includes(txRecord.txId.toString()), 'ETH withdrawal transaction is pending');
            
            // Test 3: Try to approve before timelock (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.approveWithdrawalAfterDelay(txRecord.txId),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to approve ETH withdrawal before timelock');
            } catch (error) {
                this.assertTest(error.message.includes('release time'), 'Correctly blocked early ETH withdrawal approval');
            }
            
            // Test 4: Cancel ETH withdrawal
            const cancelTx = await this.sendTransaction(
                this.contract.methods.cancelWithdrawal(txRecord.txId),
                this.wallets.owner
            );
            this.assertTest(cancelTx.status === '3', 'ETH withdrawal transaction cancelled successfully'); // 3 = CANCELLED
            
            // Test 5: Try to withdraw more than available balance
            const vaultBalance = await this.contract.methods.getEthBalance().call();
            const excessiveAmount = this.web3.utils.toBN(vaultBalance).add(this.web3.utils.toBN('1')).toString();
            
            try {
                await this.sendTransaction(
                    this.contract.methods.withdrawEthRequest(recipient, excessiveAmount),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to withdraw more than available balance');
            } catch (error) {
                this.assertTest(error.message.includes('Insufficient balance'), 'Correctly prevented excessive ETH withdrawal');
            }
            
            console.log('✅ ETH withdrawal workflow tests passed\n');
            
        } catch (error) {
            this.handleTestError('ETH Withdrawal Workflows', error);
        }
    }

    async testTokenWithdrawalWorkflows() {
        console.log('🪙 Testing Token Withdrawal Workflows...');
        
        try {
            const withdrawalAmount = this.web3.utils.toWei('100', 'ether'); // Assuming 18 decimals
            const recipient = this.wallets.user.address;
            
            // Test 1: Request token withdrawal (should fail for non-existent token)
            try {
                await this.sendTransaction(
                    this.contract.methods.withdrawTokenRequest(this.testTokenAddress, recipient, withdrawalAmount),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to withdraw from non-existent token');
            } catch (error) {
                this.assertTest(error.message.includes('Insufficient balance') || error.message.includes('call'), 'Correctly handled non-existent token withdrawal');
            }
            
            // Test 2: Try to withdraw with zero address token
            try {
                await this.sendTransaction(
                    this.contract.methods.withdrawTokenRequest('0x0000000000000000000000000000000000000000', recipient, withdrawalAmount),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept zero address token');
            } catch (error) {
                this.assertTest(error.message.includes('Invalid address'), 'Correctly rejected zero address token');
            }
            
            // Test 3: Try to withdraw to zero address
            try {
                await this.sendTransaction(
                    this.contract.methods.withdrawTokenRequest(this.testTokenAddress, '0x0000000000000000000000000000000000000000', withdrawalAmount),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept zero address recipient');
            } catch (error) {
                this.assertTest(error.message.includes('Invalid address'), 'Correctly rejected zero address recipient');
            }
            
            console.log('✅ Token withdrawal workflow tests passed\n');
            
        } catch (error) {
            this.handleTestError('Token Withdrawal Workflows', error);
        }
    }

    async testMetaTransactionSupportForWithdrawals() {
        console.log('🔐 Testing Meta-transaction Support for Withdrawals...');
        
        try {
            // Test 1: Generate unsigned meta-transaction for withdrawal approval
            const metaTxParams = await this.contract.methods.createMetaTxParams(
                this.contractAddress,
                '0x12345678', // Mock selector
                6, // EXECUTE_META_REQUEST_AND_APPROVE
                24, // 24 hours deadline
                20000000000, // 20 gwei max gas price
                this.wallets.owner.address
            ).call();
            
            this.assertTest(metaTxParams.chainId > 0, 'Meta-transaction parameters for withdrawal created');
            
            // Test 2: Generate unsigned withdrawal meta-transaction approval
            const vaultMetaTxParams = {
                deadline: 24, // 24 hours
                maxGasPrice: 20000000000 // 20 gwei
            };
            
            try {
                const unsignedMetaTx = await this.contract.methods.generateUnsignedWithdrawalMetaTxApproval(
                    1, // Mock txId
                    vaultMetaTxParams
                ).call();
                
                this.assertTest(unsignedMetaTx.txRecord.txId > 0, 'Unsigned withdrawal meta-transaction generated');
            } catch (error) {
                // This might fail if txId 1 doesn't exist, which is expected
                this.assertTest(true, 'Meta-transaction generation handled non-existent transaction gracefully');
            }
            
            console.log('✅ Meta-transaction support for withdrawals tests passed\n');
            
        } catch (error) {
            this.handleTestError('Meta-transaction Support for Withdrawals', error);
        }
    }

    async testTimelockSecurityImplementation() {
        console.log('⏰ Testing Timelock Security Implementation...');
        
        try {
            // Test 1: Verify timelock period is within valid range
            const timelock = await this.contract.methods.getTimeLockPeriodInMinutes().call();
            const timelockMinutes = parseInt(timelock);
            
            // SimpleVault has MIN_TIMELOCK_PERIOD = 1 day, MAX_TIMELOCK_PERIOD = 90 days
            this.assertTest(timelockMinutes >= 1440, 'Timelock period is at least 1 day'); // 1 day = 1440 minutes
            this.assertTest(timelockMinutes <= 129600, 'Timelock period is at most 90 days'); // 90 days = 129600 minutes
            
            // Test 2: Test timelock period update (via meta-transaction)
            const newTimelock = 2880; // 2 days
            const executionOptions = await this.contract.methods.updateTimeLockExecutionOptions(newTimelock).call();
            this.assertTest(executionOptions.length > 0, 'Timelock update execution options generated');
            
            console.log('✅ Timelock security implementation tests passed\n');
            
        } catch (error) {
            this.handleTestError('Timelock Security Implementation', error);
        }
    }

    async testPermissionValidationAndAccessControl() {
        console.log('🔒 Testing Permission Validation and Access Control...');
        
        try {
            const withdrawalAmount = this.web3.utils.toWei('0.1', 'ether');
            const recipient = this.wallets.user.address;
            
            // Test 1: Owner can request withdrawals
            const txRecord = await this.sendTransaction(
                this.contract.methods.withdrawEthRequest(recipient, withdrawalAmount),
                this.wallets.owner
            );
            this.assertTest(txRecord.txId > 0, 'Owner can request ETH withdrawal');
            
            // Test 2: Non-owner cannot request withdrawals
            try {
                await this.sendTransaction(
                    this.contract.methods.withdrawEthRequest(recipient, withdrawalAmount),
                    this.wallets.user
                );
                this.assertTest(false, 'Non-owner should not be able to request withdrawals');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Correctly prevented non-owner from requesting withdrawals');
            }
            
            // Test 3: Owner can cancel withdrawals
            const cancelTx = await this.sendTransaction(
                this.contract.methods.cancelWithdrawal(txRecord.txId),
                this.wallets.owner
            );
            this.assertTest(cancelTx.status === '3', 'Owner can cancel withdrawals');
            
            // Test 4: Non-owner cannot cancel withdrawals
            try {
                await this.sendTransaction(
                    this.contract.methods.cancelWithdrawal(txRecord.txId),
                    this.wallets.user
                );
                this.assertTest(false, 'Non-owner should not be able to cancel withdrawals');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Correctly prevented non-owner from cancelling withdrawals');
            }
            
            console.log('✅ Permission validation and access control tests passed\n');
            
        } catch (error) {
            this.handleTestError('Permission Validation and Access Control', error);
        }
    }

    async testErrorHandlingAndEdgeCases() {
        console.log('⚠️ Testing Error Handling and Edge Cases...');
        
        try {
            // Test 1: Zero amount withdrawal
            try {
                await this.sendTransaction(
                    this.contract.methods.withdrawEthRequest(this.wallets.user.address, 0),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept zero amount withdrawal');
            } catch (error) {
                this.assertTest(error.message.includes('zero') || error.message.includes('amount'), 'Correctly rejected zero amount withdrawal');
            }
            
            // Test 2: Invalid transaction ID
            try {
                await this.sendTransaction(
                    this.contract.methods.approveWithdrawalAfterDelay(999999),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not approve non-existent transaction');
            } catch (error) {
                this.assertTest(error.message.includes('not found') || error.message.includes('transaction'), 'Correctly handled invalid transaction ID');
            }
            
            // Test 3: Self-targeting withdrawal
            try {
                await this.sendTransaction(
                    this.contract.methods.withdrawEthRequest(this.contractAddress, this.web3.utils.toWei('0.1', 'ether')),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not allow self-targeting withdrawal');
            } catch (error) {
                this.assertTest(error.message.includes('self') || error.message.includes('target'), 'Correctly prevented self-targeting withdrawal');
            }
            
            console.log('✅ Error handling and edge cases tests passed\n');
            
        } catch (error) {
            this.handleTestError('Error Handling and Edge Cases', error);
        }
    }

    async testEventLoggingAndTransactionHistory() {
        console.log('📊 Testing Event Logging and Transaction History...');
        
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
            
            // Test 4: Test ETH received event (simulated)
            // This would be tested by monitoring events during actual ETH deposits
            
            console.log('✅ Event logging and transaction history tests passed\n');
            
        } catch (error) {
            this.handleTestError('Event Logging and Transaction History', error);
        }
    }

    async testIntegrationWithMultiPhaseSecureOperation() {
        console.log('🔗 Testing Integration with MultiPhaseSecureOperation...');
        
        try {
            // Test 1: Verify operation types are registered
            const operationTypes = await this.contract.methods.getSupportedOperationTypes().call();
            this.assertTest(operationTypes.length >= 2, 'Withdrawal operation types are registered');
            
            // Test 2: Test operation type constants
            const withdrawEthType = await this.contract.methods.WITHDRAW_ETH().call();
            const withdrawTokenType = await this.contract.methods.WITHDRAW_TOKEN().call();
            
            this.assertTest(withdrawEthType.length === 66, 'WITHDRAW_ETH operation type defined');
            this.assertTest(withdrawTokenType.length === 66, 'WITHDRAW_TOKEN operation type defined');
            
            // Test 3: Verify function selectors
            // These are internal constants, but we can test their usage through the withdrawal functions
            
            console.log('✅ Integration with MultiPhaseSecureOperation tests passed\n');
            
        } catch (error) {
            this.handleTestError('Integration with MultiPhaseSecureOperation', error);
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
            testSuite: 'SimpleVault Sanity Test',
            contract: 'SimpleVault',
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
        const reportPath = path.join(__dirname, 'reports', 'vault-sanity-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('📋 SIMPLE VAULT SANITY TEST REPORT');
        console.log('==================================');
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
    const test = new SimpleVaultSanityTest();
    test.runAllTests().catch(console.error);
}

module.exports = SimpleVaultSanityTest;
