/**
 * Base Test Class for SecureOwnable Tests
 * Provides common functionality for all test sections
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const EIP712Signer = require('../utils/eip712-signing');

// Load environment variables from the project root
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

class BaseSecureOwnableTest {
    constructor(testName) {
        this.testName = testName;
        this.web3 = new Web3(process.env.REMOTE_HOST ? 
            `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT}` : 
            'http://localhost:8545'
        );
        
        this.contractAddress = process.env.GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS;
        this.contractABI = this.loadABI('GuardianAccountAbstraction');
        
        // Initialize test wallets
        this.wallets = {
            wallet1: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_WALLET_1_PRIVATE_KEY),
            wallet2: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_WALLET_2_PRIVATE_KEY),
            wallet3: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_WALLET_3_PRIVATE_KEY),
            wallet4: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_WALLET_4_PRIVATE_KEY),
            wallet5: this.web3.eth.accounts.privateKeyToAccount(process.env.TEST_WALLET_5_PRIVATE_KEY)
        };
        
        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
        
        // Initialize utilities
        this.eip712Signer = new EIP712Signer(this.web3, this.contractAddress);
        
        // Dynamic role assignments - will be populated during initialization
        this.roles = {
            owner: null,
            broadcaster: null,
            recovery: null
        };
        
        this.roleWallets = {};
        
        // Test results
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            startTime: null,
            endTime: null
        };
    }

    loadABI(contractName) {
        const abiPath = path.join(__dirname, '../../../abi', `${contractName}.abi.json`);
        return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    }

    async initialize() {
        console.log(`🔧 Initializing ${this.testName}...`);
        
        // Initialize EIP-712 signer
        await this.eip712Signer.initialize();
        
        // Discover dynamic role assignments
        await this.discoverRoleAssignments();
        
        console.log(`✅ ${this.testName} initialized successfully\n`);
    }

    async discoverRoleAssignments() {
        try {
            // Get actual role addresses from contract
            this.roles.owner = await this.contract.methods.owner().call();
            this.roles.broadcaster = await this.contract.methods.getBroadcaster().call();
            this.roles.recovery = await this.contract.methods.getRecovery().call();
            
            console.log('📋 DISCOVERED ROLE ASSIGNMENTS:');
            console.log(`  👑 Owner: ${this.roles.owner}`);
            console.log(`  📡 Broadcaster: ${this.roles.broadcaster}`);
            console.log(`  🛡️ Recovery: ${this.roles.recovery}`);
            
            // Map roles to available wallets
            for (const [walletName, wallet] of Object.entries(this.wallets)) {
                if (wallet.address.toLowerCase() === this.roles.owner.toLowerCase()) {
                    this.roleWallets.owner = wallet;
                    console.log(`  🔑 Owner role served by: ${walletName} (${wallet.address})`);
                }
                if (wallet.address.toLowerCase() === this.roles.broadcaster.toLowerCase()) {
                    this.roleWallets.broadcaster = wallet;
                    console.log(`  🔑 Broadcaster role served by: ${walletName} (${wallet.address})`);
                }
                if (wallet.address.toLowerCase() === this.roles.recovery.toLowerCase()) {
                    this.roleWallets.recovery = wallet;
                    console.log(`  🔑 Recovery role served by: ${walletName} (${wallet.address})`);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to discover role assignments:', error.message);
            throw new Error(`Role discovery failed: ${error.message}`);
        }
    }

    getRoleWallet(roleName) {
        const wallet = this.roleWallets[roleName.toLowerCase()];
        if (!wallet) {
            throw new Error(`No wallet found for role: ${roleName}`);
        }
        return wallet.privateKey;
    }

    getRoleWalletObject(roleName) {
        const wallet = this.roleWallets[roleName.toLowerCase()];
        if (!wallet) {
            throw new Error(`No wallet found for role: ${roleName}`);
        }
        return wallet;
    }

    async sendTransaction(method, wallet) {
        try {
            // Estimate gas and include it in the send to avoid provider defaults causing reverts
            const from = wallet.address;
            const gas = await method.estimateGas({ from });
            const result = await method.send({ from, gas });
            return result;
        } catch (error) {
            throw new Error(`Transaction failed: ${error.message}`);
        }
    }

    async callContractMethod(method, wallet) {
        try {
            // For contract methods that return values without changing state, use call()
            const result = await method.call({ from: wallet.address });
            return result;
        } catch (error) {
            throw new Error(`Contract call failed: ${error.message}`);
        }
    }

    assertTest(condition, message) {
        this.testResults.totalTests++;
        
        if (condition) {
            this.testResults.passedTests++;
            console.log(`  ✅ ${message}`);
        } else {
            this.testResults.failedTests++;
            console.log(`  ❌ ${message}`);
            throw new Error(`Test assertion failed: ${message}`);
        }
    }

    handleTestError(testName, error) {
        this.testResults.failedTests++;
        console.log(`❌ ${testName} failed: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }

    async getRoleHash(roleName) {
        const roleMap = {
            'owner': this.web3.utils.keccak256('OWNER_ROLE'),
            'broadcaster': this.web3.utils.keccak256('BROADCASTER_ROLE'),
            'recovery': this.web3.utils.keccak256('RECOVERY_ROLE')
        };
        
        return roleMap[roleName.toLowerCase()] || '0x0000000000000000000000000000000000000000000000000000000000000000';
    }

    getFunctionSelector(signature) {
        return this.web3.utils.keccak256(signature).substring(0, 10);
    }

    async checkPendingTransactions() {
        try {
            console.log('🔍 Checking for pending transactions...');
            
            // Get all pending transactions
            const pendingTxs = await this.contract.methods.getPendingTransactions().call();
            
            if (pendingTxs.length === 0) {
                console.log('✅ No pending transactions found');
                return { hasPending: false, transactions: [] };
            }
            
            console.log(`📋 Found ${pendingTxs.length} pending transactions:`);
            
            const transactionDetails = [];
            
            // Get details for each pending transaction
            for (const txId of pendingTxs) {
                try {
                    const tx = await this.contract.methods.getTransaction(txId).call();
                    const operationType = tx.params.operationType;
                    const currentTime = Math.floor(Date.now() / 1000);
                    const timeRemaining = tx.releaseTime - currentTime;
                    
                    const txDetail = {
                        txId: txId,
                        status: tx.status,
                        operationType: operationType,
                        requester: tx.params.requester,
                        timeRemaining: timeRemaining,
                        expired: timeRemaining <= 0
                    };
                    
                    transactionDetails.push(txDetail);
                    
                    console.log(`   📋 Transaction ${txId}:`);
                    console.log(`      Status: ${tx.status} (${this.getStatusName(tx.status)})`);
                    console.log(`      Operation: ${this.getOperationName(operationType)}`);
                    console.log(`      Requester: ${tx.params.requester}`);
                    console.log(`      Time Remaining: ${timeRemaining} seconds`);
                    console.log(`      Expired: ${txDetail.expired}`);
                    
                } catch (error) {
                    console.log(`   ❌ Error getting details for transaction ${txId}: ${error.message}`);
                }
            }
            
            return { hasPending: true, transactions: transactionDetails };
            
        } catch (error) {
            console.log(`❌ Error checking pending transactions: ${error.message}`);
            return { hasPending: false, transactions: [] };
        }
    }


    async cancelTransaction(txId, operationType, requester) {
        try {
            // Determine the appropriate cancellation method and wallet based on operation type
            let cancelMethod;
            let wallet;
            
            switch (operationType) {
                case '0xb23d8fa2f62c8a954db45521d1249908693b29ffd3d2dab6348898c4198996b2': // OWNERSHIP_TRANSFER
                    cancelMethod = this.contract.methods.transferOwnershipCancellation(txId);
                    wallet = this.getRoleWalletObject('recovery'); // Only recovery can cancel ownership transfers
                    break;
                    
                case '0xae23396f8eb008d2f5f9673f91ccf20bf248201a6e0dbeaf46c421777ad8dc5b': // BROADCASTER_UPDATE
                    cancelMethod = this.contract.methods.updateBroadcasterCancellation(txId);
                    wallet = this.getRoleWalletObject('owner'); // Only owner can cancel broadcaster updates
                    break;
                    
                case '0x032398090b003ba6aff30213cf16b7307ece6fbd6d969286006538a576526983': // RECOVERY_UPDATE
                    // Recovery updates use meta-transactions, skip for now
                    console.log(`   ⚠️  Recovery update transactions require meta-transactions (skipping)`);
                    return false;
                    
                case '0x06e0fdee0e8a4d2e629ae3d26c7bc6342072096facbcbe06d204d6051d97c50f': // TIMELOCK_UPDATE
                    // Timelock updates use meta-transactions, skip for now
                    console.log(`   ⚠️  Timelock update transactions require meta-transactions (skipping)`);
                    return false;
                    
                default:
                    console.log(`   ⚠️  Unknown operation type: ${operationType}`);
                    return false;
            }
            
            // Send the cancellation transaction
            await this.sendTransaction(cancelMethod, wallet);
            return true;
            
        } catch (error) {
            console.log(`   ❌ Cancellation failed: ${error.message}`);
            return false;
        }
    }

    getStatusName(status) {
        const statusMap = {
            0: 'UNDEFINED',
            1: 'PENDING',
            2: 'CANCELLED',
            3: 'COMPLETED',
            4: 'FAILED',
            5: 'REJECTED'
        };
        return statusMap[status] || 'UNKNOWN';
    }

    getOperationName(operationType) {
        const operationMap = {
            '0xb23d8fa2f62c8a954db45521d1249908693b29ffd3d2dab6348898c4198996b2': 'OWNERSHIP_TRANSFER',
            '0xae23396f8eb008d2f5f9673f91ccf20bf248201a6e0dbeaf46c421777ad8dc5b': 'BROADCASTER_UPDATE',
            '0x032398090b003ba6aff30213cf16b7307ece6fbd6d969286006538a576526983': 'RECOVERY_UPDATE',
            '0x06e0fdee0e8a4d2e629ae3d26c7bc6342072096facbcbe06d204d6051d97c50f': 'TIMELOCK_UPDATE'
        };
        return operationMap[operationType] || 'UNKNOWN';
    }

    async validateWorkflowPermissions(workflowName, requiredPermissions) {
        console.log(`🔒 VALIDATING PERMISSIONS FOR ${workflowName.toUpperCase()}`);
        console.log('-'.repeat(50));
        
        try {
            for (const permission of requiredPermissions) {
                const { role, functionSelector, expectedActions, description } = permission;
                
                console.log(`  📋 Checking: ${description}`);
                console.log(`    Role: ${role}`);
                console.log(`    Function: ${functionSelector}`);
                console.log(`    Expected Actions: ${expectedActions.join(', ')}`);
                
                // Get role hash with timeout
                const roleHash = await this.getRoleHash(role);
                
                // Get role permissions with timeout
                const rolePermissionsPromise = this.contract.methods.getRolePermission(roleHash).call();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('getRolePermission timeout after 5 seconds')), 5000)
                );
                
                const rolePermissions = await Promise.race([rolePermissionsPromise, timeoutPromise]);
                
                // Find the specific function permission
                const functionPermission = rolePermissions.find(perm => 
                    perm.functionSelector.toLowerCase() === functionSelector.toLowerCase()
                );
                
                if (!functionPermission) {
                    throw new Error(`Function ${functionSelector} not found in ${role} role permissions`);
                }
                
                // Check if the granted actions match expected actions
                const grantedActions = functionPermission.grantedActions.map(action => parseInt(action));
                
                const hasRequiredActions = expectedActions.every(expectedAction => 
                    grantedActions.includes(expectedAction)
                );
                
                if (hasRequiredActions) {
                    console.log(`    ✅ ${role} has correct permissions for ${functionSelector}`);
                } else {
                    throw new Error(`${role} missing required permissions for ${functionSelector}`);
                }
                
                console.log();
            }
            
            console.log(`✅ All permissions validated for ${workflowName}`);
            console.log('🎯 Workflow can proceed with confidence\n');
            
        } catch (error) {
            console.log(`❌ Permission validation failed for ${workflowName}: ${error.message}`);
            throw error;
        }
    }

    async advanceBlockchainTime(seconds) {
        console.log(`⏰ ADVANCING BLOCKCHAIN TIME BY ${seconds} SECONDS`);
        console.log('-'.repeat(40));
        
        try {
            // Get initial blockchain time
            const initialBlock = await this.web3.eth.getBlock('latest');
            const initialTime = initialBlock.timestamp;
            const targetTime = initialTime + seconds;
            
            console.log(`  🕐 Initial blockchain time: ${new Date(initialTime * 1000).toLocaleString()}`);
            console.log(`  🎯 Target blockchain time: ${new Date(targetTime * 1000).toLocaleString()}`);
            
            // Use transaction-based advancement for small time periods
            console.log(`  🔄 Using transaction-based time advancement...`);
            
            let attempts = 0;
            const maxAttempts = Math.min(20, Math.ceil(seconds / 10));
            let currentTime = initialTime;
            
            while (currentTime < targetTime && attempts < maxAttempts) {
                attempts++;
                console.log(`  🔄 Attempt ${attempts}/${maxAttempts}: Sending ETH to self...`);
                
                try {
                    const tx = {
                        from: this.wallets.wallet1.address,
                        to: this.wallets.wallet1.address,
                        value: 0,
                        gas: 21000,
                        gasPrice: await this.web3.eth.getGasPrice()
                    };
                    
                    const signedTx = await this.wallets.wallet1.signTransaction(tx);
                    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                    
                    if (receipt.status) {
                        const newBlock = await this.web3.eth.getBlock('latest');
                        currentTime = newBlock.timestamp;
                        
                        console.log(`    🕐 Current blockchain time: ${new Date(currentTime * 1000).toLocaleString()}`);
                        console.log(`    📊 Block number: ${receipt.blockNumber}`);
                        
                        if (currentTime >= targetTime) {
                            console.log(`    🎯 Target time reached!`);
                            break;
                        }
                    }
                } catch (txError) {
                    console.log(`    ⚠️  Transaction error: ${txError.message}`);
                }
                
                if (attempts < maxAttempts && currentTime < targetTime) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            const finalBlock = await this.web3.eth.getBlock('latest');
            const finalTime = finalBlock.timestamp;
            
            console.log(`  🕐 Final blockchain time: ${new Date(finalTime * 1000).toLocaleString()}`);
            console.log(`  📊 Final block number: ${finalBlock.number}`);
            console.log(`  ✅ Blockchain time advancement completed`);
            console.log(`  📈 Time advanced by ${finalTime - initialTime} seconds`);
            
            return true;
            
        } catch (error) {
            console.log(`  ❌ Failed to advance blockchain time: ${error.message}`);
            return false;
        }
    }

    async waitForTimelock(txId, context = 'Timelock') {
        console.log(`⏳ WAITING FOR TIMELOCK: ${context}`);
        console.log('-'.repeat(40));
        
        try {
            // Get transaction details
            const tx = await this.contract.methods.getTransaction(txId).call();
            const releaseTime = parseInt(tx.releaseTime);
            const currentBlockTime = await this.web3.eth.getBlock('latest').then(block => block.timestamp);
            
            console.log(`  📋 Transaction ID: ${txId}`);
            console.log(`  🕐 Release time: ${new Date(releaseTime * 1000).toLocaleString()}`);
            console.log(`  🕐 Current blockchain time: ${new Date(currentBlockTime * 1000).toLocaleString()}`);
            
            const waitTime = releaseTime - currentBlockTime;
            
            if (waitTime <= 0) {
                console.log(`  ✅ Timelock already expired!`);
                return true;
            }
            
            console.log(`  ⏰ Need to wait ${waitTime} seconds for timelock to expire`);
            console.log(`  🔄 Using blockchain advancement hack...`);
            
            // Use our blockchain advancement hack
            const success = await this.advanceBlockchainTime(waitTime + 5); // Add 5 seconds buffer
            
            if (success) {
                // Verify timelock has expired
                const newBlockTime = await this.web3.eth.getBlock('latest').then(block => block.timestamp);
                console.log(`  🕐 New blockchain time: ${new Date(newBlockTime * 1000).toLocaleString()}`);
                
                if (newBlockTime >= releaseTime) {
                    console.log(`  ✅ Timelock has expired!`);
                    return true;
                } else {
                    const remainingTime = releaseTime - newBlockTime;
                    console.log(`  ⚠️  Timelock has ${remainingTime} seconds remaining`);
                    console.log(`  🔄 Attempting additional blockchain advancement...`);
                    
                    // Try to advance more time
                    const additionalSuccess = await this.advanceBlockchainTime(remainingTime + 10);
                    if (additionalSuccess) {
                        const finalBlockTime = await this.web3.eth.getBlock('latest').then(block => block.timestamp);
                        console.log(`  🕐 Final blockchain time: ${new Date(finalBlockTime * 1000).toLocaleString()}`);
                        
                        if (finalBlockTime >= releaseTime) {
                            console.log(`  ✅ Timelock has now expired!`);
                            return true;
                        } else {
                            console.log(`  ⚠️  Timelock still not expired, but continuing...`);
                            return true;
                        }
                    } else {
                        console.log(`  ⚠️  Additional blockchain advancement failed, but continuing...`);
                        return true;
                    }
                }
            } else {
                console.log(`  ⚠️  Could not advance blockchain time, but continuing...`);
                return true;
            }
            
        } catch (error) {
            console.log(`  ❌ Error waiting for timelock: ${error.message}`);
            return false;
        }
    }

    printTestResults() {
        const duration = this.testResults.endTime - this.testResults.startTime;
        const successRate = ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log(`📊 ${this.testName.toUpperCase()} TEST RESULTS`);
        console.log('='.repeat(60));
        console.log(`📋 Total Tests: ${this.testResults.totalTests}`);
        console.log(`✅ Passed: ${this.testResults.passedTests}`);
        console.log(`❌ Failed: ${this.testResults.failedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)} seconds`);
        console.log('='.repeat(60));
        
        if (this.testResults.failedTests === 0) {
            console.log('🎉 All tests passed successfully!');
        } else {
            console.log('⚠️  Some tests failed. Please review the output above.');
        }
    }

    async runTest() {
        this.testResults.startTime = Date.now();
        console.log(`🚀 Starting ${this.testName}...`);
        
        try {
            await this.initialize();
            await this.executeTests();
            
            this.testResults.endTime = Date.now();
            this.printTestResults();
            
            return this.testResults.failedTests === 0;
            
        } catch (error) {
            this.testResults.endTime = Date.now();
            this.handleTestError(this.testName, error);
            this.printTestResults();
            return false;
        }
    }

    getOperationType(operationName) {
        const operationMap = {
            'OWNERSHIP_TRANSFER': '0xb23d8fa2f62c8a954db45521d1249908693b29ffd3d2dab6348898c4198996b2',
            'BROADCASTER_UPDATE': '0xae23396f8eb008d2f5f9673f91ccf20bf248201a6e0dbeaf46c421777ad8dc5b',
            'RECOVERY_UPDATE': '0x032398090b003ba6aff30213cf16b7307ece6fbd6d969286006538a576526983',
            'TIMELOCK_UPDATE': '0x06e0fdee0e8a4d2e629ae3d26c7bc6342072096facbcbe06d204d6051d97c50f'
        };
        return operationMap[operationName] || '0x0000000000000000000000000000000000000000000000000000000000000000';
    }

    getTxAction(actionName) {
        const actionMap = {
            'EXECUTE_TIME_DELAY_REQUEST': 0,
            'EXECUTE_TIME_DELAY_APPROVE': 1,
            'EXECUTE_TIME_DELAY_CANCEL': 2,
            'SIGN_META_REQUEST_AND_APPROVE': 3,
            'SIGN_META_APPROVE': 4,
            'SIGN_META_CANCEL': 5,
            'EXECUTE_META_REQUEST_AND_APPROVE': 6,
            'EXECUTE_META_APPROVE': 7,
            'EXECUTE_META_CANCEL': 8
        };
        return actionMap[actionName] || 0;
    }

    getExecutionType(typeName) {
        const typeMap = {
            'NONE': 0,
            'STANDARD': 1,
            'RAW': 2
        };
        return typeMap[typeName] || 1;
    }

    // Abstract method - must be implemented by subclasses
    async executeTests() {
        throw new Error('executeTests() must be implemented by subclasses');
    }
}

module.exports = BaseSecureOwnableTest;
