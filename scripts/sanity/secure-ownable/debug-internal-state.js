const Web3 = require('web3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

class InternalStateDebugger {
    constructor() {
        this.web3 = new Web3(process.env.REMOTE_HOST ? 
            `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT}` : 
            'http://localhost:8545'
        );
        this.contractAddress = process.env.GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS || '0xFCB760696b5665F11692328Ea470a7cFEB5867Ef';
        this.chainId = 1337;
        
        // Load contract ABI
        const abiPath = path.join(__dirname, '../../../abi/GuardianAccountAbstraction.abi.json');
        this.contractABI = require(abiPath);
        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
    }

    async debugInternalState() {
        console.log('🔍 DEBUGGING INTERNAL STATE');
        console.log('='.repeat(60));
        
        try {
            const UPDATE_RECOVERY_META_SELECTOR = '0x2aa09cf6';
            const OWNER_ROLE = '0x0acf805600123ef007091da3b3ffb39474074c656c127aa68cb0ffec232a8ff8';
            const SIGN_META_REQUEST_AND_APPROVE = 3;
            
            // Step 1: Check getSupportedFunctionsList
            console.log('\n📋 STEP 1: Check getSupportedFunctionsList');
            console.log('-'.repeat(40));
            
            try {
                const supportedFunctions = await this.contract.methods.getSupportedFunctions().call();
                console.log(`📋 Contract supports ${supportedFunctions.length} functions:`);
                
                let recoveryFunctionFound = false;
                for (let i = 0; i < supportedFunctions.length; i++) {
                    const func = supportedFunctions[i];
                    if (func === UPDATE_RECOVERY_META_SELECTOR) {
                        recoveryFunctionFound = true;
                        console.log(`   🎯 FOUND ${UPDATE_RECOVERY_META_SELECTOR} at index ${i}`);
                    }
                }
                
                if (!recoveryFunctionFound) {
                    console.log(`   ❌ ${UPDATE_RECOVERY_META_SELECTOR} NOT found in supported functions`);
                }
                
                // List all supported functions for reference
                console.log(`\n📋 All supported functions:`);
                supportedFunctions.forEach((func, index) => {
                    console.log(`   ${index + 1}. ${func}`);
                });
                
            } catch (error) {
                console.log(`❌ getSupportedFunctions() failed: ${error.message}`);
            }
            
            // Step 2: Check if we can access the internal functions mapping
            console.log('\n📋 STEP 2: Check Internal Functions Mapping');
            console.log('-'.repeat(40));
            
            // Try to call functions that might expose internal state
            const functionsToTry = [
                'getSupportedOperationTypes',
                'getSupportedRoles', 
                'getRolePermission',
                'getSignerNonce'
            ];
            
            for (const funcName of functionsToTry) {
                try {
                    if (funcName === 'getSupportedOperationTypes') {
                        const result = await this.contract.methods[funcName]().call();
                        console.log(`✅ ${funcName}(): ${result.length} items`);
                    } else if (funcName === 'getSupportedRoles') {
                        const result = await this.contract.methods[funcName]().call();
                        console.log(`✅ ${funcName}(): ${result.length} roles`);
                    } else if (funcName === 'getRolePermission') {
                        const result = await this.contract.methods[funcName](OWNER_ROLE).call();
                        console.log(`✅ ${funcName}(): Owner has ${result.length} permissions`);
                    } else if (funcName === 'getSignerNonce') {
                        const ownerAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
                        const result = await this.contract.methods[funcName](ownerAddress).call();
                        console.log(`✅ ${funcName}(): Owner nonce = ${result}`);
                    }
                } catch (error) {
                    console.log(`❌ ${funcName}() failed: ${error.message}`);
                }
            }
            
            // Step 3: Check if we can access function schemas
            console.log('\n📋 STEP 3: Check Function Schemas Access');
            console.log('-'.repeat(40));
            
            // Try to see if there are any functions that expose the internal mappings
            const schemaFunctions = [
                'getFunctionSchemas',
                'getOperationTypes', 
                'getFunctionPermissions',
                'getRoleHashes'
            ];
            
            for (const funcName of schemaFunctions) {
                try {
                    const result = await this.contract.methods[funcName]().call();
                    console.log(`✅ ${funcName}(): Available - ${result.length} items`);
                } catch (error) {
                    console.log(`❌ ${funcName}(): Not available - ${error.message}`);
                }
            }
            
            // Step 4: Check if we can access action support functions
            console.log('\n📋 STEP 4: Check Action Support Functions');
            console.log('-'.repeat(40));
            
            // Try to see if there are functions to check action support
            const actionFunctions = [
                'isActionSupportedByFunction',
                'hasPermission',
                'checkPermission',
                'getFunctionSchema'
            ];
            
            for (const funcName of actionFunctions) {
                try {
                    if (funcName === 'isActionSupportedByFunction') {
                        const result = await this.contract.methods[funcName](UPDATE_RECOVERY_META_SELECTOR, SIGN_META_REQUEST_AND_APPROVE).call();
                        console.log(`✅ ${funcName}(): ${UPDATE_RECOVERY_META_SELECTOR} supports action ${SIGN_META_REQUEST_AND_APPROVE} = ${result}`);
                    } else if (funcName === 'hasPermission') {
                        const ownerAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
                        const result = await this.contract.methods[funcName](ownerAddress, UPDATE_RECOVERY_META_SELECTOR, SIGN_META_REQUEST_AND_APPROVE).call();
                        console.log(`✅ ${funcName}(): Owner has permission = ${result}`);
                    } else {
                        const result = await this.contract.methods[funcName]().call();
                        console.log(`✅ ${funcName}(): Available`);
                    }
                } catch (error) {
                    console.log(`❌ ${funcName}(): Not available - ${error.message}`);
                }
            }
            
            // Step 5: Check contract ABI for missing functions
            console.log('\n📋 STEP 5: Check Contract ABI for Missing Functions');
            console.log('-'.repeat(40));
            
            const expectedFunctions = [
                'getFunctionSchemas',
                'getOperationTypes',
                'getFunctionPermissions', 
                'getRoleHashes',
                'isActionSupportedByFunction',
                'hasPermission',
                'getRole'
            ];
            
            const availableFunctions = this.contractABI
                .filter(item => item.type === 'function')
                .map(item => item.name);
            
            console.log(`📋 Checking for expected functions:`);
            for (const funcName of expectedFunctions) {
                const exists = availableFunctions.includes(funcName);
                console.log(`   ${exists ? '✅' : '❌'} ${funcName}: ${exists ? 'EXISTS' : 'MISSING'}`);
            }
            
            // Step 6: Try to manually check the internal state
            console.log('\n📋 STEP 6: Manual Internal State Check');
            console.log('-'.repeat(40));
            
            try {
                // Try to call the recovery function directly to see what error we get
                console.log(`🔍 Attempting to call updateRecoveryRequestAndApprove directly...`);
                
                // Create a dummy meta-transaction
                const dummyMetaTx = {
                    txRecord: {
                        txId: 999,
                        releaseTime: Math.floor(Date.now() / 1000) + 3600,
                        status: 1,
                        params: {
                            requester: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
                            target: this.contractAddress,
                            value: '0',
                            gasLimit: '0',
                            operationType: '0x032398090b003ba6aff30213cf16b7307ece6fbd6d969286006538a576526983',
                            executionType: '1',
                            executionOptions: '0x'
                        },
                        message: '0x' + '0'.repeat(64),
                        result: '0x',
                        payment: {
                            amount: '0',
                            token: '0x0000000000000000000000000000000000000000'
                        }
                    },
                    params: {
                        chainId: this.chainId,
                        nonce: 0,
                        handlerContract: this.contractAddress,
                        handlerSelector: UPDATE_RECOVERY_META_SELECTOR,
                        action: SIGN_META_REQUEST_AND_APPROVE,
                        deadline: Math.floor(Date.now() / 1000) + 3600,
                        maxGasPrice: 0,
                        signer: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
                    },
                    message: '0x' + '0'.repeat(64),
                    signature: '0x' + '0'.repeat(130),
                    data: '0x'
                };
                
                const result = await this.contract.methods.updateRecoveryRequestAndApprove(dummyMetaTx).call();
                console.log(`✅ Direct call succeeded: ${JSON.stringify(result)}`);
                
            } catch (error) {
                console.log(`❌ Direct call failed: ${error.message}`);
                
                // Analyze the error to understand what's failing
                if (error.message.includes('Permission denied') || error.message.includes('No permission')) {
                    console.log(`   🎯 Error indicates permission issue`);
                } else if (error.message.includes('Function not supported')) {
                    console.log(`   🎯 Error indicates function not supported`);
                } else if (error.message.includes('Action not supported')) {
                    console.log(`   🎯 Error indicates action not supported`);
                } else {
                    console.log(`   🎯 Error type: ${error.message.substring(0, 100)}...`);
                }
            }
            
            // Step 7: Summary
            console.log('\n🎯 INTERNAL STATE ANALYSIS SUMMARY');
            console.log('='.repeat(60));
            console.log('✅ Internal state debugging completed');
            console.log('📋 This should reveal where the permission issue originates');
            console.log('📋 Check if functions are in supported list but permissions are missing');
            
            return true;
            
        } catch (error) {
            console.log(`💥 Internal state debugging failed: ${error.message}`);
            return false;
        }
    }
}

// Run the debug
if (require.main === module) {
    const internalDebugger = new InternalStateDebugger();
    internalDebugger.debugInternalState()
        .then((success) => {
            if (success) {
                console.log('\n🎉 Internal state debugging completed!');
            } else {
                console.log('\n💥 Internal state debugging failed');
            }
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('\n💥 Debugging failed:', error.message);
            process.exit(1);
        });
}

module.exports = InternalStateDebugger;
