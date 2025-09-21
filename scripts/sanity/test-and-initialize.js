/**
 * Test and Initialize Contracts Script
 * 
 * This script tests if contracts are properly initialized and initializes them if needed.
 */

const Web3 = require('web3');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

class ContractInitializer {
    constructor() {
        this.web3 = new Web3(process.env.REMOTE_HOST ? 
            `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT}` : 
            'http://localhost:8545'
        );
        
        // Contract addresses from environment
        this.contracts = {
            GuardianAccountAbstraction: process.env.GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS,
            GuardianAccountAbstractionWithRoles: process.env.GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS,
            SimpleVault: process.env.SIMPLE_VAULT_ADDRESS,
            SimpleRWA20: process.env.SIMPLE_RWA20_ADDRESS
        };
        
        // Test accounts
        this.accounts = {
            owner: process.env.TEST_OWNER_PRIVATE_KEY,
            broadcaster: process.env.TEST_BROADCASTER_PRIVATE_KEY,
            recovery: process.env.TEST_RECOVERY_PRIVATE_KEY
        };
    }

    async testAndInitialize() {
        console.log('🔍 Testing Contract Initialization Status...\n');
        
        for (const [name, address] of Object.entries(this.contracts)) {
            if (!address) {
                console.log(`❌ ${name}: No address found in environment`);
                continue;
            }
            
            console.log(`📋 Testing ${name} at ${address}...`);
            
            try {
                // Load ABI
                const abiPath = `abi/${name}.abi.json`;
                if (!fs.existsSync(abiPath)) {
                    console.log(`  ❌ ABI file not found: ${abiPath}`);
                    continue;
                }
                
                const abi = JSON.parse(fs.readFileSync(abiPath));
                const contract = new this.web3.eth.Contract(abi, address);
                
                // Test basic functions
                await this.testContract(name, contract);
                
            } catch (error) {
                console.log(`  ❌ Error testing ${name}: ${error.message}`);
            }
            
            console.log('');
        }
    }

    async testContract(name, contract) {
        try {
            // Test supportsInterface (should always work)
            const supportsERC165 = await contract.methods.supportsInterface('0x01ffc9a7').call();
            console.log(`  ✅ supportsInterface: ${supportsERC165}`);
            
            // Test owner function (requires initialization)
            try {
                const owner = await contract.methods.owner().call();
                console.log(`  ✅ owner: ${owner}`);
                console.log(`  ✅ ${name} is properly initialized`);
                
                // Test additional functions if owner works
                if (contract.methods.getBroadcaster) {
                    const broadcaster = await contract.methods.getBroadcaster().call();
                    console.log(`  ✅ broadcaster: ${broadcaster}`);
                }
                
                if (contract.methods.getRecovery) {
                    const recovery = await contract.methods.getRecovery().call();
                    console.log(`  ✅ recovery: ${recovery}`);
                }
                
                if (contract.methods.getTimeLockPeriodInMinutes) {
                    const timelock = await contract.methods.getTimeLockPeriodInMinutes().call();
                    console.log(`  ✅ timelock: ${timelock} minutes`);
                }
                
            } catch (error) {
                console.log(`  ❌ owner() failed: ${error.message}`);
                console.log(`  ⚠️  ${name} is NOT properly initialized`);
                
                // Try to initialize
                await this.tryInitialize(name, contract);
            }
            
        } catch (error) {
            console.log(`  ❌ Contract test failed: ${error.message}`);
        }
    }

    async tryInitialize(name, contract) {
        console.log(`  🔧 Attempting to initialize ${name}...`);
        
        try {
            // Check if initialize function exists
            const initializeFunction = contract.methods.initialize;
            if (!initializeFunction) {
                console.log(`  ❌ No initialize function found`);
                return;
            }
            
            // Get account from private key
            const account = this.web3.eth.accounts.privateKeyToAccount(this.accounts.owner);
            this.web3.eth.accounts.wallet.add(account);
            
            // Prepare initialization parameters
            const initParams = [
                account.address,  // initialOwner
                account.address,  // broadcaster  
                account.address,  // recovery
                60,               // timeLockPeriodInMinutes (1 hour)
                '0x0000000000000000000000000000000000000000'  // eventForwarder (none)
            ];
            
            // For SimpleRWA20, add token parameters
            if (name === 'SimpleRWA20') {
                initParams.unshift('SimpleRWA20', 'SRWA'); // name, symbol
            }
            
            console.log(`  📤 Sending initialize transaction...`);
            console.log(`  📋 Parameters:`, initParams);
            
            const gasEstimate = await initializeFunction(...initParams).estimateGas({ from: account.address });
            const gasPrice = await this.web3.eth.getGasPrice();
            
            const result = await initializeFunction(...initParams).send({
                from: account.address,
                gas: gasEstimate,
                gasPrice: gasPrice
            });
            
            console.log(`  ✅ Initialize transaction successful: ${result.transactionHash}`);
            
            // Test again after initialization
            const owner = await contract.methods.owner().call();
            console.log(`  ✅ Initialization successful! Owner: ${owner}`);
            
        } catch (error) {
            console.log(`  ❌ Initialization failed: ${error.message}`);
            
            // If initialization failed, it might already be initialized
            if (error.message.includes('already initialized') || error.message.includes('Initializable: contract is already initialized')) {
                console.log(`  ⚠️  Contract might already be initialized but state is corrupted`);
            }
        }
    }
}

// Run the test and initialization
async function main() {
    const initializer = new ContractInitializer();
    await initializer.testAndInitialize();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ContractInitializer;
