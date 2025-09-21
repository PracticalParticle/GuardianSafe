// SPDX-License-Identifier: MPL-2.0
// Real Contract Analysis using Guardian Analyzer

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

// Deployed contract addresses (Updated after migration)
const DEPLOYED_CONTRACTS = {
  GuardianAccountAbstraction: '0xabd688943c065dEB475D7d1c5c829d18aEE185e7',
  GuardianAccountAbstractionWithRoles: '0x0665417be6D5638AF01776593b4d2474Cb944aa9',
  SimpleVault: '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3',
  SimpleRWA20: '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92'
};

// Try to detect what functions are available on a contract
async function detectContractFunctions(client, contractAddress) {
  console.log(`🔍 Detecting functions for contract: ${contractAddress}`);
  
  // Common function selectors to try
  const commonSelectors = [
    { name: 'owner()', selector: '0x8da5cb5b' },
    { name: 'initialized()', selector: '0x158ef93e' },
    { name: 'getRoleCount()', selector: '0x8da5cb5b' }, // This might be wrong
    { name: 'timeLockPeriod()', selector: '0x8da5cb5b' }, // This might be wrong
    { name: 'getSupportedOperationTypes()', selector: '0x8da5cb5b' }, // This might be wrong
    { name: 'getSupportedFunctions()', selector: '0x8da5cb5b' }, // This might be wrong
  ];
  
  const availableFunctions = [];
  
  for (const func of commonSelectors) {
    try {
      await client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: func.name.split('(')[0],
          outputs: [{ name: '', type: 'bytes' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: func.name.split('(')[0]
      });
      availableFunctions.push(func.name);
      console.log(`   ✅ ${func.name} - Available`);
    } catch (error) {
      console.log(`   ❌ ${func.name} - Not available (${error.message.split('\n')[0]})`);
    }
  }
  
  return availableFunctions;
}

// Check if contract has code
async function checkContractCode(client, contractAddress) {
  try {
    const code = await client.getCode({ address: contractAddress });
    if (code === '0x') {
      return false; // No code at address
    }
    return true; // Has code
  } catch (error) {
    console.log(`   ❌ Error checking code: ${error.message}`);
    return false;
  }
}

// Analyze a single contract
async function analyzeContract(client, contractName, contractAddress) {
  console.log(`\n🔍 Analyzing ${contractName}:`);
  console.log(`   Address: ${contractAddress}`);
  
  // Check if contract has code
  const hasCode = await checkContractCode(client, contractAddress);
  if (!hasCode) {
    console.log(`   ❌ No contract code found at this address`);
    return {
      name: contractName,
      address: contractAddress,
      hasCode: false,
      status: 'NOT_DEPLOYED'
    };
  }
  
  console.log(`   ✅ Contract code found`);
  
  // Try to detect available functions
  const availableFunctions = await detectContractFunctions(client, contractAddress);
  
  // Try to get basic info
  let owner = null;
  let initialized = null;
  
  // Try owner function
  if (availableFunctions.includes('owner()')) {
    try {
      owner = await client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: 'owner',
          outputs: [{ name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'owner'
      });
      console.log(`   👤 Owner: ${owner}`);
    } catch (error) {
      console.log(`   ❌ Owner: Error - ${error.message.split('\n')[0]}`);
    }
  }
  
  // Try initialized function
  if (availableFunctions.includes('initialized()')) {
    try {
      initialized = await client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: 'initialized',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'initialized'
      });
      console.log(`   🚀 Initialized: ${initialized}`);
    } catch (error) {
      console.log(`   ❌ Initialized: Error - ${error.message.split('\n')[0]}`);
    }
  }
  
  // Determine status
  let status = 'UNKNOWN';
  if (owner && owner !== '0x0000000000000000000000000000000000000000') {
    if (initialized === true) {
      status = 'PROPERLY_INITIALIZED';
    } else if (initialized === false) {
      status = 'NOT_INITIALIZED';
    } else {
      status = 'PROPERLY_INITIALIZED_CONSTRUCTOR';
    }
  } else {
    status = 'NO_OWNER';
  }
  
  console.log(`   📊 Status: ${status}`);
  
  return {
    name: contractName,
    address: contractAddress,
    hasCode: true,
    owner,
    initialized,
    availableFunctions,
    status
  };
}

// Main analysis function
async function analyzeAllContracts() {
  console.log('🔍 Real Contract Analysis using Guardian Analyzer\n');
  
  // Create Viem client
  const client = createPublicClient({
    chain: NETWORK_CONFIG,
    transport: http()
  });
  
  console.log('📋 Analyzing all deployed contracts...\n');
  
  const results = [];
  
  for (const [contractName, contractAddress] of Object.entries(DEPLOYED_CONTRACTS)) {
    const result = await analyzeContract(client, contractName, contractAddress);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Contract Analysis Summary:');
  console.log('================================');
  
  results.forEach(result => {
    const name = result.name.padEnd(35);
    const hasCode = result.hasCode ? '✅' : '❌';
    const owner = result.owner ? '✅' : '❌';
    const status = result.status.padEnd(25);
    
    console.log(`${name} | Code: ${hasCode} | Owner: ${owner} | Status: ${status}`);
  });
  
  // Overall status
  const totalContracts = results.length;
  const deployedContracts = results.filter(r => r.hasCode).length;
  const hasOwner = results.filter(r => r.owner && r.owner !== '0x0000000000000000000000000000000000000000').length;
  const properlyInitialized = results.filter(r => 
    r.status === 'PROPERLY_INITIALIZED' || r.status === 'PROPERLY_INITIALIZED_CONSTRUCTOR'
  ).length;
  
  console.log('\n🎯 Overall Status:');
  console.log(`   Total Contracts: ${totalContracts}`);
  console.log(`   ✅ Deployed (has code): ${deployedContracts}`);
  console.log(`   ✅ Have Owner: ${hasOwner}`);
  console.log(`   ✅ Properly Initialized: ${properlyInitialized}`);
  
  if (deployedContracts === totalContracts && properlyInitialized === totalContracts) {
    console.log('\n🎉 All contracts are properly deployed and initialized!');
  } else if (deployedContracts < totalContracts) {
    console.log('\n⚠️  Some contracts are not deployed or have no code.');
  } else {
    console.log('\n⚠️  Some contracts have initialization issues.');
  }
  
  // Detailed function analysis
  console.log('\n🔧 Available Functions Analysis:');
  console.log('=================================');
  
  results.forEach(result => {
    if (result.hasCode && result.availableFunctions.length > 0) {
      console.log(`\n${result.name}:`);
      result.availableFunctions.forEach(func => {
        console.log(`   ✅ ${func}`);
      });
    }
  });
}

// Run the analysis
analyzeAllContracts()
  .then(() => {
    console.log('\n✅ Contract analysis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Contract analysis failed:', error);
    process.exit(1);
  });
