// SPDX-License-Identifier: MPL-2.0
// Manual Contract Initialization Script

const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Load environment variables
require('dotenv').config();

// Network configuration
const NETWORK_CONFIG = {
  id: 1337, // Use the actual chain ID from the network
  name: 'remote_ganache',
  rpcUrls: {
    default: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] },
    public: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] }
  },
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
};

// Deployed contract addresses
const DEPLOYED_CONTRACTS = {
  GuardianAccountAbstraction: '0xabd688943c065dEB475D7d1c5c829d18aEE185e7',
  GuardianAccountAbstractionWithRoles: '0x0665417be6D5638AF01776593b4d2474Cb944aa9',
  SimpleVault: '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3',
  SimpleRWA20: '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92'
};

// Use the first account from Ganache (this should be the deployer)
const DEPLOYER_PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
const DEPLOYER_ADDRESS = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';

// Initialize ABI for Guardian contracts
const INITIALIZE_ABI = [
  {
    inputs: [
      { name: 'initialOwner', type: 'address' },
      { name: 'broadcaster', type: 'address' },
      { name: 'recovery', type: 'address' },
      { name: 'timeLockPeriodInMinutes', type: 'uint256' },
      { name: 'eventForwarder', type: 'address' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Initialize ABI for SimpleRWA20 (has additional parameters)
const INITIALIZE_RWA20_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'initialOwner', type: 'address' },
      { name: 'broadcaster', type: 'address' },
      { name: 'recovery', type: 'address' },
      { name: 'timeLockPeriodInMinutes', type: 'uint256' },
      { name: 'eventForwarder', type: 'address' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

async function initializeContract(client, walletClient, contractName, contractAddress, abi, params) {
  console.log(`🔧 Initializing ${contractName}...`);
  console.log(`   Address: ${contractAddress}`);
  
  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: abi,
      functionName: 'initialize',
      args: params,
      account: DEPLOYER_ADDRESS
    });
    
    console.log(`   ✅ Transaction sent: ${hash}`);
    
    // Wait for transaction receipt
    const receipt = await client.waitForTransactionReceipt({ hash });
    console.log(`   ✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Initialization failed: ${error.message}`);
    return false;
  }
}

async function checkInitializationStatus(client, contractName, contractAddress) {
  console.log(`🔍 Checking initialization status for ${contractName}...`);
  
  try {
    // Try to call owner function
    const owner = await client.readContract({
      address: contractAddress,
      abi: [{ inputs: [], name: 'owner', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' }],
      functionName: 'owner'
    });
    
    if (owner && owner !== '0x0000000000000000000000000000000000000000') {
      console.log(`   ✅ Owner: ${owner}`);
      return true;
    } else {
      console.log(`   ❌ No owner set`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error checking owner: ${error.message.split('\n')[0]}`);
    return false;
  }
}

async function initializeAllContracts() {
  console.log('🚀 Manual Contract Initialization Script\n');
  
  // Create clients
  const client = createPublicClient({
    chain: NETWORK_CONFIG,
    transport: http()
  });
  
  const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: NETWORK_CONFIG,
    transport: http()
  });
  
  console.log(`📋 Using deployer account: ${DEPLOYER_ADDRESS}\n`);
  
  // Check current status
  console.log('📊 Current Initialization Status:');
  console.log('==================================');
  
  for (const [contractName, contractAddress] of Object.entries(DEPLOYED_CONTRACTS)) {
    await checkInitializationStatus(client, contractName, contractAddress);
  }
  
  console.log('\n🔧 Starting Initialization Process:');
  console.log('====================================');
  
  const results = [];
  
  // Initialize GuardianAccountAbstraction
  const guardianParams = [
    DEPLOYER_ADDRESS,  // initialOwner
    DEPLOYER_ADDRESS,  // broadcaster
    DEPLOYER_ADDRESS,  // recovery
    60,                // timeLockPeriodInMinutes (1 hour)
    '0x0000000000000000000000000000000000000000'  // eventForwarder (none)
  ];
  
  const guardianResult = await initializeContract(
    client, 
    walletClient, 
    'GuardianAccountAbstraction', 
    DEPLOYED_CONTRACTS.GuardianAccountAbstraction, 
    INITIALIZE_ABI, 
    guardianParams
  );
  results.push({ name: 'GuardianAccountAbstraction', success: guardianResult });
  
  // Initialize GuardianAccountAbstractionWithRoles
  const guardianRolesResult = await initializeContract(
    client, 
    walletClient, 
    'GuardianAccountAbstractionWithRoles', 
    DEPLOYED_CONTRACTS.GuardianAccountAbstractionWithRoles, 
    INITIALIZE_ABI, 
    guardianParams
  );
  results.push({ name: 'GuardianAccountAbstractionWithRoles', success: guardianRolesResult });
  
  // Initialize SimpleVault
  const vaultResult = await initializeContract(
    client, 
    walletClient, 
    'SimpleVault', 
    DEPLOYED_CONTRACTS.SimpleVault, 
    INITIALIZE_ABI, 
    guardianParams
  );
  results.push({ name: 'SimpleVault', success: vaultResult });
  
  // Initialize SimpleRWA20 (with additional parameters)
  const rwa20Params = [
    'SimpleRWA20',     // name
    'SRWA',            // symbol
    DEPLOYER_ADDRESS,  // initialOwner
    DEPLOYER_ADDRESS,  // broadcaster
    DEPLOYER_ADDRESS,  // recovery
    60,                // timeLockPeriodInMinutes (1 hour)
    '0x0000000000000000000000000000000000000000'  // eventForwarder (none)
  ];
  
  const rwa20Result = await initializeContract(
    client, 
    walletClient, 
    'SimpleRWA20', 
    DEPLOYED_CONTRACTS.SimpleRWA20, 
    INITIALIZE_RWA20_ABI, 
    rwa20Params
  );
  results.push({ name: 'SimpleRWA20', success: rwa20Result });
  
  // Final status check
  console.log('\n📊 Final Initialization Status:');
  console.log('================================');
  
  for (const [contractName, contractAddress] of Object.entries(DEPLOYED_CONTRACTS)) {
    await checkInitializationStatus(client, contractName, contractAddress);
  }
  
  // Summary
  console.log('\n🎯 Initialization Summary:');
  console.log('==========================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully initialized: ${successful}`);
  console.log(`❌ Failed to initialize: ${failed}`);
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.name}`);
  });
  
  if (successful === results.length) {
    console.log('\n🎉 All contracts initialized successfully!');
  } else {
    console.log('\n⚠️  Some contracts failed to initialize. Check the error messages above.');
  }
}

// Run the initialization
initializeAllContracts()
  .then(() => {
    console.log('\n✅ Contract initialization script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Contract initialization script failed:', error);
    process.exit(1);
  });
