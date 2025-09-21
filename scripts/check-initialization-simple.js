// SPDX-License-Identifier: MPL-2.0
// Simple Contract Initialization Status Checker

const { createPublicClient, http } = require('viem');

// Load environment variables
require('dotenv').config();

// Network configuration
const NETWORK_CONFIG = {
  id: 1753647079019,
  name: 'remote_ganache',
  rpcUrls: {
    default: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] },
    public: { http: [`http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`] }
  },
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
};

// Deployed contract addresses
const DEPLOYED_CONTRACTS = {
  GuardianAccountAbstraction: '0xf759A0e8F2fFBb5F5a9DD50f1106668FBE29bC93',
  GuardianAccountAbstractionWithRoles: '0xA5682DF1987D214Fe4dfC3a262179eBDc205b525',
  SimpleVault: '0x430316d13cB31B834174D8d4223c5d5599209f79',
  SimpleRWA20: '0x365fE252c93E161619E21cF135ae86CD4C031466'
};

// Common ABI for checking basic contract state
const COMMON_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'initialized',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getRoleCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'timeLockPeriod',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

async function checkContractBasicStatus(client, contractName, contractAddress) {
  console.log(`🔍 Checking ${contractName}:`);
  console.log(`   Address: ${contractAddress}`);
  
  const status = {
    name: contractName,
    address: contractAddress,
    owner: null,
    initialized: null,
    roleCount: null,
    timeLockPeriod: null,
    errors: []
  };
  
  try {
    // Check owner
    try {
      status.owner = await client.readContract({
        address: contractAddress,
        abi: COMMON_ABI,
        functionName: 'owner'
      });
      console.log(`   👤 Owner: ${status.owner}`);
    } catch (error) {
      status.errors.push(`Owner check failed: ${error.message}`);
      console.log(`   ❌ Owner: Error - ${error.message}`);
    }
    
    // Check initialization status
    try {
      status.initialized = await client.readContract({
        address: contractAddress,
        abi: COMMON_ABI,
        functionName: 'initialized'
      });
      console.log(`   🚀 Initialized: ${status.initialized}`);
    } catch (error) {
      status.errors.push(`Initialization check failed: ${error.message}`);
      console.log(`   ❌ Initialized: Error - ${error.message}`);
    }
    
    // Check role count (for RBAC contracts)
    try {
      status.roleCount = await client.readContract({
        address: contractAddress,
        abi: COMMON_ABI,
        functionName: 'getRoleCount'
      });
      console.log(`   👥 Role Count: ${status.roleCount}`);
    } catch (error) {
      // This is expected for non-RBAC contracts
      console.log(`   ℹ️  Role Count: Not applicable (not RBAC contract)`);
    }
    
    // Check time lock period (for MultiPhase contracts)
    try {
      status.timeLockPeriod = await client.readContract({
        address: contractAddress,
        abi: COMMON_ABI,
        functionName: 'timeLockPeriod'
      });
      console.log(`   ⏰ Time Lock Period: ${status.timeLockPeriod} seconds`);
    } catch (error) {
      // This is expected for non-MultiPhase contracts
      console.log(`   ℹ️  Time Lock Period: Not applicable (not MultiPhase contract)`);
    }
    
    // Determine initialization status
    let initStatus = 'UNKNOWN';
    if (status.owner && status.owner !== '0x0000000000000000000000000000000000000000') {
      if (status.initialized === true) {
        initStatus = '✅ PROPERLY INITIALIZED';
      } else if (status.initialized === false) {
        initStatus = '⚠️  NOT INITIALIZED (upgradeable contract)';
      } else {
        initStatus = '✅ PROPERLY INITIALIZED (constructor-based)';
      }
    } else {
      initStatus = '❌ NOT INITIALIZED (no owner)';
    }
    
    console.log(`   📊 Status: ${initStatus}`);
    
    if (status.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${status.errors.join(', ')}`);
    }
    
    console.log('');
    return status;
    
  } catch (error) {
    console.log(`   ❌ Critical Error: ${error.message}`);
    console.log('');
    status.errors.push(`Critical error: ${error.message}`);
    return status;
  }
}

async function checkAllContractsInitialization() {
  console.log('🔍 Contract Initialization Status Checker\n');
  
  // Create Viem client
  const client = createPublicClient({
    chain: NETWORK_CONFIG,
    transport: http()
  });
  
  console.log('📋 Checking initialization status for all contracts...\n');
  
  const results = [];
  
  for (const [contractName, contractAddress] of Object.entries(DEPLOYED_CONTRACTS)) {
    const status = await checkContractBasicStatus(client, contractName, contractAddress);
    results.push(status);
  }
  
  // Summary
  console.log('📊 Initialization Status Summary:');
  console.log('================================');
  
  results.forEach(result => {
    const name = result.name.padEnd(35);
    const owner = result.owner ? '✅' : '❌';
    const initialized = result.initialized === true ? '✅' : 
                       result.initialized === false ? '⚠️' : 'ℹ️';
    const errors = result.errors.length > 0 ? `⚠️ (${result.errors.length})` : '✅';
    
    console.log(`${name} | Owner: ${owner} | Init: ${initialized} | Errors: ${errors}`);
  });
  
  // Overall status
  const totalContracts = results.length;
  const hasOwner = results.filter(r => r.owner && r.owner !== '0x0000000000000000000000000000000000000000').length;
  const hasErrors = results.filter(r => r.errors.length > 0).length;
  const properlyInitialized = results.filter(r => 
    r.owner && 
    r.owner !== '0x0000000000000000000000000000000000000000' && 
    r.errors.length === 0
  ).length;
  
  console.log('\n🎯 Overall Status:');
  console.log(`   Total Contracts: ${totalContracts}`);
  console.log(`   ✅ Have Owner: ${hasOwner}`);
  console.log(`   ✅ Properly Initialized: ${properlyInitialized}`);
  console.log(`   ⚠️  Have Errors: ${hasErrors}`);
  
  if (hasErrors === 0 && properlyInitialized === totalContracts) {
    console.log('\n🎉 All contracts are properly initialized and functioning correctly!');
  } else if (hasErrors > 0) {
    console.log('\n⚠️  Some contracts have initialization issues that need attention.');
  } else {
    console.log('\n✅ All contracts have owners and appear to be properly initialized.');
  }
}

// Run the initialization check
checkAllContractsInitialization()
  .then(() => {
    console.log('\n✅ Initialization check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization check failed:', error);
    process.exit(1);
  });
