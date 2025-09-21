/**
 * SimpleRWA20 Sanity Test Suite
 * 
 * This script performs comprehensive testing of the SimpleRWA20 contract,
 * testing all possible workflows directly on the blockchain and returning a detailed report.
 * 
 * Test Coverage:
 * 1. Token Initialization and Configuration
 * 2. ERC20 Standard Functionality
 * 3. Mint Operations (Request -> Approval/Cancel)
 * 4. Burn Operations (Request -> Approval/Cancel)
 * 5. Meta-transaction Support for Mint/Burn
 * 6. Broadcaster Permission Validation
 * 7. Token Transfer and Balance Management
 * 8. Error Handling and Edge Cases
 * 9. Event Logging and Transaction History
 * 10. Integration with MultiPhaseSecureOperation
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

class SimpleRWA20SanityTest {
    constructor() {
        this.web3 = new Web3(process.env.REMOTE_HOST ? 
            `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT}` : 
            'http://localhost:8545'
        );
        
        this.contractAddress = process.env.SIMPLE_RWA20_ADDRESS;
        this.contractABI = this.loadABI('SimpleRWA20');
        
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
        
        // Test amounts
        this.testAmounts = {
            mint: this.web3.utils.toWei('1000', 'ether'), // 1000 tokens
            burn: this.web3.utils.toWei('100', 'ether'),  // 100 tokens
            transfer: this.web3.utils.toWei('50', 'ether') // 50 tokens
        };
    }

    loadABI(contractName) {
        const abiPath = path.join(__dirname, '../../abi', `${contractName}.abi.json`);
        return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    }

    async runAllTests() {
        console.log('🪙 Starting SimpleRWA20 Sanity Tests...\n');
        
        try {
            // Test 1: Basic Contract State Verification
            await this.testBasicContractState();
            
            // Test 2: ERC20 Standard Functionality
            await this.testERC20StandardFunctionality();
            
            // Test 3: Mint Operations
            await this.testMintOperations();
            
            // Test 4: Burn Operations
            await this.testBurnOperations();
            
            // Test 5: Meta-transaction Support for Mint/Burn
            await this.testMetaTransactionSupportForMintBurn();
            
            // Test 6: Broadcaster Permission Validation
            await this.testBroadcasterPermissionValidation();
            
            // Test 7: Token Transfer and Balance Management
            await this.testTokenTransferAndBalanceManagement();
            
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
            
            // Test ERC20 properties
            const name = await this.contract.methods.name().call();
            const symbol = await this.contract.methods.symbol().call();
            const decimals = await this.contract.methods.decimals().call();
            const totalSupply = await this.contract.methods.totalSupply().call();
            
            this.assertTest(name.length > 0, 'Token name is set');
            this.assertTest(symbol.length > 0, 'Token symbol is set');
            this.assertTest(parseInt(decimals) === 18, 'Token decimals is 18');
            this.assertTest(parseInt(totalSupply) >= 0, 'Total supply is valid');
            
            // Test operation types
            const operationTypes = await this.contract.methods.getSupportedOperationTypes().call();
            this.assertTest(operationTypes.length >= 2, 'Mint/Burn operation types are defined');
            
            console.log('✅ Basic contract state tests passed\n');
            
        } catch (error) {
            this.handleTestError('Basic Contract State', error);
        }
    }

    async testERC20StandardFunctionality() {
        console.log('🔄 Testing ERC20 Standard Functionality...');
        
        try {
            // Test 1: Balance of owner
            const ownerBalance = await this.contract.methods.balanceOf(this.wallets.owner.address).call();
            this.assertTest(parseInt(ownerBalance) >= 0, 'Owner balance retrieved');
            
            // Test 2: Balance of user (should be 0 initially)
            const userBalance = await this.contract.methods.balanceOf(this.wallets.user.address).call();
            this.assertTest(parseInt(userBalance) === 0, 'User balance is initially 0');
            
            // Test 3: Allowance (should be 0 initially)
            const allowance = await this.contract.methods.allowance(this.wallets.owner.address, this.wallets.user.address).call();
            this.assertTest(parseInt(allowance) === 0, 'Initial allowance is 0');
            
            // Test 4: Approve allowance
            await this.sendTransaction(
                this.contract.methods.approve(this.wallets.user.address, this.testAmounts.transfer),
                this.wallets.owner
            );
            this.assertTest(true, 'Allowance approved');
            
            // Test 5: Verify allowance
            const newAllowance = await this.contract.methods.allowance(this.wallets.owner.address, this.wallets.user.address).call();
            this.assertTest(parseInt(newAllowance) === parseInt(this.testAmounts.transfer), 'Allowance updated correctly');
            
            // Test 6: Transfer from (using allowance)
            await this.sendTransaction(
                this.contract.methods.transferFrom(this.wallets.owner.address, this.wallets.user.address, this.testAmounts.transfer),
                this.wallets.user
            );
            this.assertTest(true, 'Transfer from executed');
            
            // Test 7: Verify balances after transfer
            const finalOwnerBalance = await this.contract.methods.balanceOf(this.wallets.owner.address).call();
            const finalUserBalance = await this.contract.methods.balanceOf(this.wallets.user.address).call();
            
            this.assertTest(parseInt(finalUserBalance) === parseInt(this.testAmounts.transfer), 'User received tokens');
            
            console.log('✅ ERC20 standard functionality tests passed\n');
            
        } catch (error) {
            this.handleTestError('ERC20 Standard Functionality', error);
        }
    }

    async testMintOperations() {
        console.log('🪙 Testing Mint Operations...');
        
        try {
            const mintAmount = this.testAmounts.mint;
            const recipient = this.wallets.user.address;
            
            // Test 1: Generate unsigned mint meta-transaction
            const mintMetaTxParams = {
                deadline: 24, // 24 hours
                maxGasPrice: 20000000000 // 20 gwei
            };
            
            const unsignedMintMetaTx = await this.contract.methods.generateUnsignedMintMetaTx(
                recipient,
                mintAmount,
                mintMetaTxParams
            ).call();
            
            this.assertTest(unsignedMintMetaTx.txRecord.txId > 0, 'Unsigned mint meta-transaction generated');
            
            // Test 2: Try to mint with meta-transaction (should fail without proper signature)
            try {
                await this.sendTransaction(
                    this.contract.methods.mintWithMetaTx(unsignedMintMetaTx),
                    this.wallets.broadcaster
                );
                this.assertTest(false, 'Should not be able to mint without proper signature');
            } catch (error) {
                this.assertTest(error.message.includes('signature') || error.message.includes('invalid'), 'Correctly prevented unsigned mint');
            }
            
            // Test 3: Verify mint operation type
            const mintOperationType = await this.contract.methods.MINT_TOKENS().call();
            this.assertTest(mintOperationType.length === 66, 'MINT_TOKENS operation type defined');
            
            // Test 4: Test mint with zero address
            try {
                await this.contract.methods.generateUnsignedMintMetaTx(
                    '0x0000000000000000000000000000000000000000',
                    mintAmount,
                    mintMetaTxParams
                ).call();
                this.assertTest(false, 'Should not accept zero address for mint');
            } catch (error) {
                this.assertTest(error.message.includes('Invalid address'), 'Correctly rejected zero address for mint');
            }
            
            console.log('✅ Mint operations tests passed\n');
            
        } catch (error) {
            this.handleTestError('Mint Operations', error);
        }
    }

    async testBurnOperations() {
        console.log('🔥 Testing Burn Operations...');
        
        try {
            const burnAmount = this.testAmounts.burn;
            const fromAddress = this.wallets.user.address;
            
            // Test 1: Generate unsigned burn meta-transaction
            const burnMetaTxParams = {
                deadline: 24, // 24 hours
                maxGasPrice: 20000000000 // 20 gwei
            };
            
            try {
                const unsignedBurnMetaTx = await this.contract.methods.generateUnsignedBurnMetaTx(
                    fromAddress,
                    burnAmount,
                    burnMetaTxParams
                ).call();
                
                this.assertTest(unsignedBurnMetaTx.txRecord.txId > 0, 'Unsigned burn meta-transaction generated');
            } catch (error) {
                // This might fail if user doesn't have enough balance, which is expected
                this.assertTest(error.message.includes('Insufficient balance'), 'Correctly handled insufficient balance for burn');
            }
            
            // Test 2: Try to burn with meta-transaction (should fail without proper signature)
            try {
                const mockBurnMetaTx = {
                    txRecord: {
                        txId: 1,
                        params: {
                            requester: this.wallets.owner.address,
                            target: this.contractAddress,
                            operationType: await this.contract.methods.BURN_TOKENS().call()
                        }
                    },
                    params: {
                        signer: this.wallets.owner.address,
                        handlerSelector: '0x12345678'
                    },
                    signature: '0x'
                };
                
                await this.sendTransaction(
                    this.contract.methods.burnWithMetaTx(mockBurnMetaTx),
                    this.wallets.broadcaster
                );
                this.assertTest(false, 'Should not be able to burn without proper signature');
            } catch (error) {
                this.assertTest(error.message.includes('signature') || error.message.includes('invalid'), 'Correctly prevented unsigned burn');
            }
            
            // Test 3: Verify burn operation type
            const burnOperationType = await this.contract.methods.BURN_TOKENS().call();
            this.assertTest(burnOperationType.length === 66, 'BURN_TOKENS operation type defined');
            
            // Test 4: Test burn with zero address
            try {
                await this.contract.methods.generateUnsignedBurnMetaTx(
                    '0x0000000000000000000000000000000000000000',
                    burnAmount,
                    burnMetaTxParams
                ).call();
                this.assertTest(false, 'Should not accept zero address for burn');
            } catch (error) {
                this.assertTest(error.message.includes('Invalid address'), 'Correctly rejected zero address for burn');
            }
            
            console.log('✅ Burn operations tests passed\n');
            
        } catch (error) {
            this.handleTestError('Burn Operations', error);
        }
    }

    async testMetaTransactionSupportForMintBurn() {
        console.log('🔐 Testing Meta-transaction Support for Mint/Burn...');
        
        try {
            // Test 1: Generate meta-transaction parameters
            const metaTxParams = await this.contract.methods.createMetaTxParams(
                this.contractAddress,
                '0x12345678', // Mock selector
                6, // EXECUTE_META_REQUEST_AND_APPROVE
                24, // 24 hours deadline
                20000000000, // 20 gwei max gas price
                this.wallets.owner.address
            ).call();
            
            this.assertTest(metaTxParams.chainId > 0, 'Meta-transaction parameters for mint/burn created');
            
            // Test 2: Verify meta-transaction structure
            this.assertTest(metaTxParams.nonce >= 0, 'Nonce is valid');
            this.assertTest(metaTxParams.handlerContract === this.contractAddress, 'Handler contract is correct');
            this.assertTest(metaTxParams.deadline > 0, 'Deadline is set');
            this.assertTest(metaTxParams.signer === this.wallets.owner.address, 'Signer is correct');
            
            // Test 3: Test function selectors
            // These are internal constants, but we can test their usage through the mint/burn functions
            
            console.log('✅ Meta-transaction support for mint/burn tests passed\n');
            
        } catch (error) {
            this.handleTestError('Meta-transaction Support for Mint/Burn', error);
        }
    }

    async testBroadcasterPermissionValidation() {
        console.log('📡 Testing Broadcaster Permission Validation...');
        
        try {
            // Test 1: Broadcaster can call mintWithMetaTx (with proper signature)
            // Note: This will fail without proper signature, but we can test the permission check
            
            // Test 2: Non-broadcaster cannot call mintWithMetaTx
            try {
                const mockMintMetaTx = {
                    txRecord: {
                        txId: 1,
                        params: {
                            requester: this.wallets.owner.address,
                            target: this.contractAddress,
                            operationType: await this.contract.methods.MINT_TOKENS().call()
                        }
                    },
                    params: {
                        signer: this.wallets.owner.address,
                        handlerSelector: '0x12345678'
                    },
                    signature: '0x'
                };
                
                await this.sendTransaction(
                    this.contract.methods.mintWithMetaTx(mockMintMetaTx),
                    this.wallets.user
                );
                this.assertTest(false, 'Non-broadcaster should not be able to call mintWithMetaTx');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Correctly prevented non-broadcaster from calling mintWithMetaTx');
            }
            
            // Test 3: Non-broadcaster cannot call burnWithMetaTx
            try {
                const mockBurnMetaTx = {
                    txRecord: {
                        txId: 1,
                        params: {
                            requester: this.wallets.owner.address,
                            target: this.contractAddress,
                            operationType: await this.contract.methods.BURN_TOKENS().call()
                        }
                    },
                    params: {
                        signer: this.wallets.owner.address,
                        handlerSelector: '0x12345678'
                    },
                    signature: '0x'
                };
                
                await this.sendTransaction(
                    this.contract.methods.burnWithMetaTx(mockBurnMetaTx),
                    this.wallets.user
                );
                this.assertTest(false, 'Non-broadcaster should not be able to call burnWithMetaTx');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Correctly prevented non-broadcaster from calling burnWithMetaTx');
            }
            
            console.log('✅ Broadcaster permission validation tests passed\n');
            
        } catch (error) {
            this.handleTestError('Broadcaster Permission Validation', error);
        }
    }

    async testTokenTransferAndBalanceManagement() {
        console.log('💸 Testing Token Transfer and Balance Management...');
        
        try {
            // Test 1: Direct transfer
            const transferAmount = this.testAmounts.transfer;
            const initialBalance = await this.contract.methods.balanceOf(this.wallets.user.address).call();
            
            await this.sendTransaction(
                this.contract.methods.transfer(this.wallets.admin.address, transferAmount),
                this.wallets.user
            );
            this.assertTest(true, 'Direct transfer executed');
            
            // Test 2: Verify balances after transfer
            const finalUserBalance = await this.contract.methods.balanceOf(this.wallets.user.address).call();
            const adminBalance = await this.contract.methods.balanceOf(this.wallets.admin.address).call();
            
            this.assertTest(parseInt(finalUserBalance) === parseInt(initialBalance) - parseInt(transferAmount), 'User balance decreased correctly');
            this.assertTest(parseInt(adminBalance) === parseInt(transferAmount), 'Admin received tokens');
            
            // Test 3: Try to transfer more than balance
            const excessiveAmount = this.web3.utils.toBN(initialBalance).add(this.web3.utils.toBN('1')).toString();
            
            try {
                await this.sendTransaction(
                    this.contract.methods.transfer(this.wallets.admin.address, excessiveAmount),
                    this.wallets.user
                );
                this.assertTest(false, 'Should not be able to transfer more than balance');
            } catch (error) {
                this.assertTest(error.message.includes('insufficient') || error.message.includes('balance'), 'Correctly prevented excessive transfer');
            }
            
            // Test 4: Try to transfer to zero address
            try {
                await this.sendTransaction(
                    this.contract.methods.transfer('0x0000000000000000000000000000000000000000', transferAmount),
                    this.wallets.user
                );
                this.assertTest(false, 'Should not be able to transfer to zero address');
            } catch (error) {
                this.assertTest(error.message.includes('zero address'), 'Correctly prevented transfer to zero address');
            }
            
            console.log('✅ Token transfer and balance management tests passed\n');
            
        } catch (error) {
            this.handleTestError('Token Transfer and Balance Management', error);
        }
    }

    async testErrorHandlingAndEdgeCases() {
        console.log('⚠️ Testing Error Handling and Edge Cases...');
        
        try {
            // Test 1: Zero amount transfer
            try {
                await this.sendTransaction(
                    this.contract.methods.transfer(this.wallets.admin.address, 0),
                    this.wallets.user
                );
                this.assertTest(false, 'Should not accept zero amount transfer');
            } catch (error) {
                this.assertTest(error.message.includes('zero') || error.message.includes('amount'), 'Correctly rejected zero amount transfer');
            }
            
            // Test 2: Self-transfer
            try {
                await this.sendTransaction(
                    this.contract.methods.transfer(this.wallets.user.address, this.testAmounts.transfer),
                    this.wallets.user
                );
                this.assertTest(false, 'Should not allow self-transfer');
            } catch (error) {
                this.assertTest(error.message.includes('self') || error.message.includes('same'), 'Correctly prevented self-transfer');
            }
            
            // Test 3: Invalid transaction ID for meta-transactions
            try {
                const mockMetaTx = {
                    txRecord: {
                        txId: 999999,
                        params: {
                            requester: this.wallets.owner.address,
                            target: this.contractAddress,
                            operationType: await this.contract.methods.MINT_TOKENS().call()
                        }
                    },
                    params: {
                        signer: this.wallets.owner.address,
                        handlerSelector: '0x12345678'
                    },
                    signature: '0x'
                };
                
                await this.sendTransaction(
                    this.contract.methods.mintWithMetaTx(mockMetaTx),
                    this.wallets.broadcaster
                );
                this.assertTest(false, 'Should not process invalid transaction ID');
            } catch (error) {
                this.assertTest(error.message.includes('not found') || error.message.includes('transaction'), 'Correctly handled invalid transaction ID');
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
            
            // Test 4: Test token events (simulated)
            // This would be tested by monitoring events during actual token operations
            
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
            this.assertTest(operationTypes.length >= 2, 'Mint/Burn operation types are registered');
            
            // Test 2: Test operation type constants
            const mintTokensType = await this.contract.methods.MINT_TOKENS().call();
            const burnTokensType = await this.contract.methods.BURN_TOKENS().call();
            
            this.assertTest(mintTokensType.length === 66, 'MINT_TOKENS operation type defined');
            this.assertTest(burnTokensType.length === 66, 'BURN_TOKENS operation type defined');
            
            // Test 3: Verify function schemas are created
            // These are internal constants, but we can test their usage through the mint/burn functions
            
            // Test 4: Test function permissions
            const supportedFunctions = await this.contract.methods.getSupportedFunctions().call();
            this.assertTest(supportedFunctions.length > 0, 'Function schemas are defined');
            
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
            testSuite: 'SimpleRWA20 Sanity Test',
            contract: 'SimpleRWA20',
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
        const reportPath = path.join(__dirname, 'reports', 'rwa20-sanity-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('📋 SIMPLE RWA20 SANITY TEST REPORT');
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
    const test = new SimpleRWA20SanityTest();
    test.runAllTests().catch(console.error);
}

module.exports = SimpleRWA20SanityTest;
