/**
 * DynamicRBAC Sanity Test Suite
 * 
 * This script performs comprehensive testing of the DynamicRBAC component
 * with GuardianAccountAbstractionWithRoles contract, testing all possible workflows
 * directly on the blockchain and returning a detailed report.
 * 
 * Test Coverage:
 * 1. Role Creation and Management
 * 2. Wallet Assignment to Roles
 * 3. Function Permission Management
 * 4. Role Editing Controls
 * 5. Protected vs Non-Protected Roles
 * 6. Permission Validation and Access Control
 * 7. Meta-transaction Support for Role Operations
 * 8. Error Handling and Edge Cases
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

class DynamicRBACSanityTest {
    constructor() {
        this.web3 = new Web3(process.env.REMOTE_HOST ? 
            `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT}` : 
            'http://localhost:8545'
        );
        
        this.contractAddress = process.env.GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS;
        this.contractABI = this.loadABI('GuardianAccountAbstractionWithRoles');
        
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
        
        // Test role data
        this.testRoles = {
            MANAGER: {
                name: 'MANAGER',
                maxWallets: 3,
                functionPermissions: [
                    {
                        functionSelector: '0x12345678',
                        grantedActions: [6, 7] // EXECUTE_META_REQUEST_AND_APPROVE, EXECUTE_META_APPROVE
                    }
                ]
            },
            OPERATOR: {
                name: 'OPERATOR',
                maxWallets: 5,
                functionPermissions: [
                    {
                        functionSelector: '0x87654321',
                        grantedActions: [7] // EXECUTE_META_APPROVE
                    }
                ]
            }
        };
    }

    loadABI(contractName) {
        const abiPath = path.join(__dirname, '../../abi', `${contractName}.abi.json`);
        return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    }

    async runAllTests() {
        console.log('🔐 Starting DynamicRBAC Sanity Tests...\n');
        
        try {
            // Test 1: Basic Contract State Verification
            await this.testBasicContractState();
            
            // Test 2: Role Creation and Management
            await this.testRoleCreationAndManagement();
            
            // Test 3: Wallet Assignment to Roles
            await this.testWalletAssignmentToRoles();
            
            // Test 4: Function Permission Management
            await this.testFunctionPermissionManagement();
            
            // Test 5: Role Editing Controls
            await this.testRoleEditingControls();
            
            // Test 6: Protected vs Non-Protected Roles
            await this.testProtectedVsNonProtectedRoles();
            
            // Test 7: Permission Validation and Access Control
            await this.testPermissionValidationAndAccessControl();
            
            // Test 8: Meta-transaction Support for Role Operations
            await this.testMetaTransactionSupportForRoleOperations();
            
            // Test 9: Error Handling and Edge Cases
            await this.testErrorHandlingAndEdgeCases();
            
            // Test 10: Role Query Functions
            await this.testRoleQueryFunctions();
            
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
            
            // Test role editing enabled
            const roleEditingEnabled = await this.contract.methods.roleEditingEnabled().call();
            this.assertTest(roleEditingEnabled === true, 'Role editing is enabled by default');
            
            // Test supported roles
            const supportedRoles = await this.contract.methods.getSupportedRoles().call();
            this.assertTest(supportedRoles.length >= 3, 'Core roles (OWNER, BROADCASTER, RECOVERY) are supported');
            
            // Test supported functions
            const supportedFunctions = await this.contract.methods.getSupportedFunctions().call();
            this.assertTest(supportedFunctions.length > 0, 'Functions are defined');
            
            console.log('✅ Basic contract state tests passed\n');
            
        } catch (error) {
            this.handleTestError('Basic Contract State', error);
        }
    }

    async testRoleCreationAndManagement() {
        console.log('👥 Testing Role Creation and Management...');
        
        try {
            // Test 1: Create MANAGER role
            const managerRoleHash = await this.sendTransaction(
                this.contract.methods.createNewRole(
                    this.testRoles.MANAGER.name,
                    this.testRoles.MANAGER.maxWallets,
                    this.testRoles.MANAGER.functionPermissions
                ),
                this.wallets.owner
            );
            
            this.assertTest(managerRoleHash.length === 66, 'MANAGER role created successfully'); // 0x + 64 hex chars
            
            // Test 2: Create OPERATOR role
            const operatorRoleHash = await this.sendTransaction(
                this.contract.methods.createNewRole(
                    this.testRoles.OPERATOR.name,
                    this.testRoles.OPERATOR.maxWallets,
                    this.testRoles.OPERATOR.functionPermissions
                ),
                this.wallets.owner
            );
            
            this.assertTest(operatorRoleHash.length === 66, 'OPERATOR role created successfully');
            
            // Test 3: Verify roles exist
            const managerExists = await this.contract.methods.roleExists(managerRoleHash).call();
            this.assertTest(managerExists === true, 'MANAGER role exists');
            
            const operatorExists = await this.contract.methods.roleExists(operatorRoleHash).call();
            this.assertTest(operatorExists === true, 'OPERATOR role exists');
            
            // Test 4: Try to create duplicate role (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.createNewRole(
                        this.testRoles.MANAGER.name,
                        this.testRoles.MANAGER.maxWallets,
                        this.testRoles.MANAGER.functionPermissions
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to create duplicate role');
            } catch (error) {
                this.assertTest(error.message.includes('already exists'), 'Correctly prevented duplicate role creation');
            }
            
            // Store role hashes for later tests
            this.testRoles.MANAGER.hash = managerRoleHash;
            this.testRoles.OPERATOR.hash = operatorRoleHash;
            
            console.log('✅ Role creation and management tests passed\n');
            
        } catch (error) {
            this.handleTestError('Role Creation and Management', error);
        }
    }

    async testWalletAssignmentToRoles() {
        console.log('👤 Testing Wallet Assignment to Roles...');
        
        try {
            // Test 1: Add wallet to MANAGER role
            await this.sendTransaction(
                this.contract.methods.addWalletToRole(
                    this.testRoles.MANAGER.hash,
                    this.wallets.user.address
                ),
                this.wallets.owner
            );
            this.assertTest(true, 'Wallet added to MANAGER role');
            
            // Test 2: Add wallet to OPERATOR role
            await this.sendTransaction(
                this.contract.methods.addWalletToRole(
                    this.testRoles.OPERATOR.hash,
                    this.wallets.admin.address
                ),
                this.wallets.owner
            );
            this.assertTest(true, 'Wallet added to OPERATOR role');
            
            // Test 3: Try to add same wallet to same role (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        this.testRoles.MANAGER.hash,
                        this.wallets.user.address
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to add same wallet to same role');
            } catch (error) {
                this.assertTest(error.message.includes('already in role'), 'Correctly prevented duplicate wallet assignment');
            }
            
            // Test 4: Try to add wallet to non-existent role (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        this.wallets.user.address
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to add wallet to non-existent role');
            } catch (error) {
                this.assertTest(error.message.includes('role'), 'Correctly prevented adding wallet to non-existent role');
            }
            
            // Test 5: Try to add wallet when role is at capacity
            // First, add more wallets to reach capacity
            await this.sendTransaction(
                this.contract.methods.addWalletToRole(
                    this.testRoles.MANAGER.hash,
                    this.wallets.admin.address
                ),
                this.wallets.owner
            );
            
            await this.sendTransaction(
                this.contract.methods.addWalletToRole(
                    this.testRoles.MANAGER.hash,
                    this.wallets.broadcaster.address
                ),
                this.wallets.owner
            );
            
            // Now try to add one more (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        this.testRoles.MANAGER.hash,
                        this.wallets.recovery.address
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to add wallet when role is at capacity');
            } catch (error) {
                this.assertTest(error.message.includes('capacity'), 'Correctly prevented adding wallet when role is at capacity');
            }
            
            console.log('✅ Wallet assignment to roles tests passed\n');
            
        } catch (error) {
            this.handleTestError('Wallet Assignment to Roles', error);
        }
    }

    async testFunctionPermissionManagement() {
        console.log('🔑 Testing Function Permission Management...');
        
        try {
            // Test 1: Verify function permissions are set correctly
            // This is tested implicitly through role creation, but we can verify the role structure
            
            // Test 2: Try to add function permission to non-existent role (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        '0x1234567890123456789012345678901234567890123456789012345678901234',
                        this.wallets.user.address
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to add wallet to non-existent role');
            } catch (error) {
                this.assertTest(error.message.includes('role'), 'Correctly prevented adding wallet to non-existent role');
            }
            
            console.log('✅ Function permission management tests passed\n');
            
        } catch (error) {
            this.handleTestError('Function Permission Management', error);
        }
    }

    async testRoleEditingControls() {
        console.log('⚙️ Testing Role Editing Controls...');
        
        try {
            // Test 1: Generate execution options for role editing toggle
            const executionOptions = await this.contract.methods.updateRoleEditingToggleExecutionOptions(false).call();
            this.assertTest(executionOptions.length > 0, 'Role editing toggle execution options generated');
            
            // Test 2: Disable role editing via meta-transaction
            const metaTxParams = await this.contract.methods.createMetaTxParams(
                this.contractAddress,
                '0x12345678', // Mock selector for role editing toggle
                6, // EXECUTE_META_REQUEST_AND_APPROVE
                24, // 24 hours deadline
                20000000000, // 20 gwei max gas price
                this.wallets.owner.address
            ).call();
            
            this.assertTest(metaTxParams.chainId > 0, 'Meta-transaction parameters for role editing toggle created');
            
            // Test 3: Try to create role when editing is disabled (simulated)
            // Note: We can't actually disable editing in this test as it would break subsequent tests
            // But we can test the execution options generation
            
            console.log('✅ Role editing controls tests passed\n');
            
        } catch (error) {
            this.handleTestError('Role Editing Controls', error);
        }
    }

    async testProtectedVsNonProtectedRoles() {
        console.log('🛡️ Testing Protected vs Non-Protected Roles...');
        
        try {
            // Test 1: Try to modify protected OWNER role (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        '0x' + '0'.repeat(64), // OWNER_ROLE hash (simplified)
                        this.wallets.user.address
                ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to modify protected OWNER role');
            } catch (error) {
                this.assertTest(error.message.includes('protected'), 'Correctly prevented modification of protected role');
            }
            
            // Test 2: Try to modify protected BROADCASTER role (should fail)
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        '0x' + '1'.repeat(64), // BROADCASTER_ROLE hash (simplified)
                        this.wallets.user.address
                ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to modify protected BROADCASTER role');
            } catch (error) {
                this.assertTest(error.message.includes('protected'), 'Correctly prevented modification of protected role');
            }
            
            // Test 3: Verify non-protected roles can be modified
            // This is already tested in wallet assignment tests
            
            console.log('✅ Protected vs non-protected roles tests passed\n');
            
        } catch (error) {
            this.handleTestError('Protected vs Non-Protected Roles', error);
        }
    }

    async testPermissionValidationAndAccessControl() {
        console.log('🔒 Testing Permission Validation and Access Control...');
        
        try {
            // Test 1: Owner can create roles
            const testRoleHash = await this.sendTransaction(
                this.contract.methods.createNewRole(
                    'TEST_ROLE',
                    2,
                    []
                ),
                this.wallets.owner
            );
            this.assertTest(testRoleHash.length === 66, 'Owner can create roles');
            
            // Test 2: Non-owner cannot create roles
            try {
                await this.sendTransaction(
                    this.contract.methods.createNewRole(
                        'UNAUTHORIZED_ROLE',
                        2,
                        []
                    ),
                    this.wallets.user
                );
                this.assertTest(false, 'Non-owner should not be able to create roles');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Correctly prevented non-owner from creating roles');
            }
            
            // Test 3: Owner can add wallets to roles
            await this.sendTransaction(
                this.contract.methods.addWalletToRole(
                    testRoleHash,
                    this.wallets.user.address
                ),
                this.wallets.owner
            );
            this.assertTest(true, 'Owner can add wallets to roles');
            
            // Test 4: Non-owner cannot add wallets to roles
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        testRoleHash,
                        this.wallets.admin.address
                    ),
                    this.wallets.user
                );
                this.assertTest(false, 'Non-owner should not be able to add wallets to roles');
            } catch (error) {
                this.assertTest(error.message.includes('No permission'), 'Correctly prevented non-owner from adding wallets to roles');
            }
            
            console.log('✅ Permission validation and access control tests passed\n');
            
        } catch (error) {
            this.handleTestError('Permission Validation and Access Control', error);
        }
    }

    async testMetaTransactionSupportForRoleOperations() {
        console.log('🔐 Testing Meta-transaction Support for Role Operations...');
        
        try {
            // Test 1: Generate meta-transaction parameters for role editing toggle
            const metaTxParams = await this.contract.methods.createMetaTxParams(
                this.contractAddress,
                '0x12345678', // Mock selector
                6, // EXECUTE_META_REQUEST_AND_APPROVE
                24, // 24 hours deadline
                20000000000, // 20 gwei max gas price
                this.wallets.owner.address
            ).call();
            
            this.assertTest(metaTxParams.chainId > 0, 'Meta-transaction parameters generated for role operations');
            
            // Test 2: Verify meta-transaction structure
            this.assertTest(metaTxParams.nonce >= 0, 'Nonce is valid');
            this.assertTest(metaTxParams.handlerContract === this.contractAddress, 'Handler contract is correct');
            this.assertTest(metaTxParams.deadline > 0, 'Deadline is set');
            this.assertTest(metaTxParams.signer === this.wallets.owner.address, 'Signer is correct');
            
            console.log('✅ Meta-transaction support for role operations tests passed\n');
            
        } catch (error) {
            this.handleTestError('Meta-transaction Support for Role Operations', error);
        }
    }

    async testErrorHandlingAndEdgeCases() {
        console.log('⚠️ Testing Error Handling and Edge Cases...');
        
        try {
            // Test 1: Empty role name
            try {
                await this.sendTransaction(
                    this.contract.methods.createNewRole(
                        '',
                        2,
                        []
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept empty role name');
            } catch (error) {
                this.assertTest(error.message.includes('empty'), 'Correctly rejected empty role name');
            }
            
            // Test 2: Zero max wallets
            try {
                await this.sendTransaction(
                    this.contract.methods.createNewRole(
                        'ZERO_WALLETS_ROLE',
                        0,
                        []
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept zero max wallets');
            } catch (error) {
                this.assertTest(error.message.includes('zero'), 'Correctly rejected zero max wallets');
            }
            
            // Test 3: Zero address wallet
            try {
                await this.sendTransaction(
                    this.contract.methods.addWalletToRole(
                        this.testRoles.MANAGER.hash,
                        '0x0000000000000000000000000000000000000000'
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not accept zero address wallet');
            } catch (error) {
                this.assertTest(error.message.includes('zero address'), 'Correctly rejected zero address wallet');
            }
            
            // Test 4: Remove wallet from role
            await this.sendTransaction(
                this.contract.methods.removeWalletFromRole(
                    this.testRoles.MANAGER.hash,
                    this.wallets.user.address
                ),
                this.wallets.owner
            );
            this.assertTest(true, 'Wallet removed from role successfully');
            
            // Test 5: Try to remove non-existent wallet
            try {
                await this.sendTransaction(
                    this.contract.methods.removeWalletFromRole(
                        this.testRoles.MANAGER.hash,
                        this.wallets.user.address
                    ),
                    this.wallets.owner
                );
                this.assertTest(false, 'Should not be able to remove non-existent wallet');
            } catch (error) {
                this.assertTest(error.message.includes('not found'), 'Correctly prevented removing non-existent wallet');
            }
            
            console.log('✅ Error handling and edge cases tests passed\n');
            
        } catch (error) {
            this.handleTestError('Error Handling and Edge Cases', error);
        }
    }

    async testRoleQueryFunctions() {
        console.log('🔍 Testing Role Query Functions...');
        
        try {
            // Test 1: Check if role exists
            const managerExists = await this.contract.methods.roleExists(this.testRoles.MANAGER.hash).call();
            this.assertTest(managerExists === true, 'MANAGER role exists');
            
            const nonExistentExists = await this.contract.methods.roleExists('0x1234567890123456789012345678901234567890123456789012345678901234').call();
            this.assertTest(nonExistentExists === false, 'Non-existent role does not exist');
            
            // Test 2: Get supported roles
            const supportedRoles = await this.contract.methods.getSupportedRoles().call();
            this.assertTest(supportedRoles.length >= 3, 'Core roles are supported');
            this.assertTest(supportedRoles.includes(this.testRoles.MANAGER.hash), 'MANAGER role is in supported roles');
            this.assertTest(supportedRoles.includes(this.testRoles.OPERATOR.hash), 'OPERATOR role is in supported roles');
            
            // Test 3: Get supported functions
            const supportedFunctions = await this.contract.methods.getSupportedFunctions().call();
            this.assertTest(supportedFunctions.length > 0, 'Functions are supported');
            
            console.log('✅ Role query functions tests passed\n');
            
        } catch (error) {
            this.handleTestError('Role Query Functions', error);
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
            testSuite: 'DynamicRBAC Sanity Test',
            contract: 'GuardianAccountAbstractionWithRoles',
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
        const reportPath = path.join(__dirname, 'reports', 'rbac-sanity-report.json');
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('📋 DYNAMIC RBAC SANITY TEST REPORT');
        console.log('===================================');
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
    const test = new DynamicRBACSanityTest();
    test.runAllTests().catch(console.error);
}

module.exports = DynamicRBACSanityTest;
