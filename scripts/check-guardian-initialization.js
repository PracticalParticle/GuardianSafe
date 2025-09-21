// SPDX-License-Identifier: MPL-2.0
// Guardian Contract Initialization Status Checker

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

// Guardian-specific ABI
const GUARDIAN_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getBroadcaster',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getRecovery',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getSupportedOperationTypes',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getSupportedFunctions',
    outputs: [{ name: '', type: 'bytes4[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getSupportedRoles',
    outputs: [{ name: '', type: 'bytes32[]' }],
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

async function checkGuardianContractStatus(client, contractName, contractAddress) {
  console.log(`🔍 Checking ${contractName}:`);
  console.log(`   Address: ${contractAddress}`);
  
  const status = {
    name: contractName,
    address: contractAddress,
    owner: null,
    broadcaster: null,
    recovery: null,
    operationTypes: null,
    supportedFunctions: null,
    supportedRoles: null,
    timeLockPeriod: null,
    errors: []
  };
  
  try {
    // Check owner (Guardian-specific implementation)
    try {
      status.owner = await client.readContract({
        address: contractAddress,
        abi: GUARDIAN_ABI,
        functionName: 'owner'
      });
      console.log(`   👤 Owner: ${status.owner}`);
    } catch (error) {
      status.errors.push(`Owner check failed: ${error.message.split('\n')[0]}`);
      console.log(`   ❌ Owner: Error - ${error.message.split('\n')[0]}`);
    }
    
    // Check broadcaster
    try {
      status.broadcaster = await client.readContract({
        address: contractAddress,
        abi: GUARDIAN_ABI,
        functionName: 'getBroadcaster'
      });
      console.log(`   📡 Broadcaster: ${status.broadcaster}`);
    } catch (error) {
      status.errors.push(`Broadcaster check failed: ${error.message.split('\n')[0]}`);
      console.log(`   ❌ Broadcaster: Error - ${error.message.split('\n')[0]}`);
    }
    
    // Check recovery
    try {
      status.recovery = await client.readContract({
        address: contractAddress,
        abi: GUARDIAN_ABI,
        functionName: 'getRecovery'
      });
      console.log(`   🔒 Recovery: ${status.recovery}`);
    } catch (error) {
      status.errors.push(`Recovery check failed: ${error.message.split('\n')[0]}`);
      console.log(`   ❌ Recovery: Error - ${error.message.split('\n')[0]}`);
    }
    
    // Check supported operation types
    try {
      status.operationTypes = await client.readContract({
        address: contractAddress,
        abi: GUARDIAN_ABI,
        functionName: 'getSupportedOperationTypes'
      });
      console.log(`   🔧 Operation Types: ${status.operationTypes.length} types`);
      if (status.operationTypes.length > 0) {
        console.log(`      Types: ${status.operationTypes.join(', ')}`);
      }
    } catch (error) {
      status.errors.push(`Operation types check failed: ${error.message.split('\n')[0]}`);
      console.log(`   ❌ Operation Types: Error - ${error.message.split('\n')[0]}`);
    }
    
    // Check supported functions
    try {
      status.supportedFunctions = await client.readContract({
        address: contractAddress,
        abi: GUARDIAN_ABI,
        functionName: 'getSupportedFunctions'
      });
      console.log(`   ⚙️  Supported Functions: ${status.supportedFunctions.length} functions`);
    } catch (error) {
      status.errors.push(`Supported functions check failed: ${error.message.split('\n')[0]}`);
      console.log(`   ❌ Supported Functions: Error - ${error.message.split('\n')[0]}`);
    }
    
    // Check supported roles (for RBAC contracts)
    try {
      status.supportedRoles = await client.readContract({
        address: contractAddress,
        abi: GUARDIAN_ABI,
        functionName: 'getSupportedRoles'
      });
      console.log(`   👥 Supported Roles: ${status.supportedRoles.length} roles`);
      if (status.supportedRoles.length > 0) {
        console.log(`      Roles: ${status.supportedRoles.join(', ')}`);
      }
    } catch (error) {
      // This might not be available for all contracts
      console.log(`   ℹ️  Supported Roles: Not available (not RBAC contract)`);
    }
    
    // Check time lock period (for MultiPhase contracts)
    try {
      status.timeLockPeriod = await client.readContract({
        address: contractAddress,
        abi: GUARDIAN_ABI,
        functionName: 'timeLockPeriod'
      });
      console.log(`   ⏰ Time Lock Period: ${status.timeLockPeriod} seconds`);
    } catch (error) {
      // This might not be available for all contracts
      console.log(`   ℹ️  Time Lock Period: Not available (not MultiPhase contract)`);
    }
    
    // Determine initialization status
    let initStatus = 'UNKNOWN';
    if (status.owner && status.owner !== '0x0000000000000000000000000000000000000000') {
      if (status.operationTypes && status.operationTypes.length > 0) {
        initStatus = '✅ PROPERLY INITIALIZED';
      } else {
        initStatus = '⚠️  PARTIALLY INITIALIZED (no operation types)';
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

async function checkAllGuardianContracts() {
  console.log('🔍 Guardian Contract Initialization Status Checker\n');
  
  // Create Viem client
  const client = createPublicClient({
    chain: NETWORK_CONFIG,
    transport: http()
  });
  
  console.log('📋 Checking Guardian-specific initialization status...\n');
  
  const results = [];
  
  for (const [contractName, contractAddress] of Object.entries(DEPLOYED_CONTRACTS)) {
    const status = await checkGuardianContractStatus(client, contractName, contractAddress);
    results.push(status);
  }
  
  // Summary
  console.log('📊 Guardian Contract Status Summary:');
  console.log('====================================');
  
  results.forEach(result => {
    const name = result.name.padEnd(35);
    const owner = result.owner ? '✅' : '❌';
    const broadcaster = result.broadcaster ? '✅' : '❌';
    const recovery = result.recovery ? '✅' : '❌';
    const opTypes = result.operationTypes ? `${result.operationTypes.length}` : '0';
    const functions = result.supportedFunctions ? `${result.supportedFunctions.length}` : '0';
    const errors = result.errors.length > 0 ? `⚠️ (${result.errors.length})` : '✅';
    
    console.log(`${name} | Owner: ${owner} | Broadcaster: ${broadcaster} | Recovery: ${recovery} | OpTypes: ${opTypes} | Functions: ${functions} | Errors: ${errors}`);
  });
  
  // Overall status
  const totalContracts = results.length;
  const hasOwner = results.filter(r => r.owner && r.owner !== '0x0000000000000000000000000000000000000000').length;
  const hasBroadcaster = results.filter(r => r.broadcaster && r.broadcaster !== '0x0000000000000000000000000000000000000000').length;
  const hasRecovery = results.filter(r => r.recovery && r.recovery !== '0x0000000000000000000000000000000000000000').length;
  const hasOperationTypes = results.filter(r => r.operationTypes && r.operationTypes.length > 0).length;
  const hasFunctions = results.filter(r => r.supportedFunctions && r.supportedFunctions.length > 0).length;
  const hasErrors = results.filter(r => r.errors.length > 0).length;
  
  console.log('\n🎯 Overall Status:');
  console.log(`   Total Contracts: ${totalContracts}`);
  console.log(`   ✅ Have Owner: ${hasOwner}`);
  console.log(`   ✅ Have Broadcaster: ${hasBroadcaster}`);
  console.log(`   ✅ Have Recovery: ${hasRecovery}`);
  console.log(`   ✅ Have Operation Types: ${hasOperationTypes}`);
  console.log(`   ✅ Have Functions: ${hasFunctions}`);
  console.log(`   ⚠️  Have Errors: ${hasErrors}`);
  
  if (hasOwner === totalContracts && hasOperationTypes === totalContracts && hasFunctions === totalContracts) {
    console.log('\n🎉 All Guardian contracts are properly initialized and functional!');
  } else if (hasErrors > 0) {
    console.log('\n⚠️  Some contracts have initialization issues that need attention.');
  } else {
    console.log('\n✅ All contracts have core Guardian functionality working.');
  }
  
  // Detailed analysis
  console.log('\n🔧 Guardian Functionality Analysis:');
  console.log('====================================');
  
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    if (result.owner) console.log(`   👤 Owner: ${result.owner}`);
    if (result.broadcaster) console.log(`   📡 Broadcaster: ${result.broadcaster}`);
    if (result.recovery) console.log(`   🔒 Recovery: ${result.recovery}`);
    if (result.operationTypes) console.log(`   🔧 Operation Types: ${result.operationTypes.join(', ')}`);
    if (result.supportedRoles) console.log(`   👥 Roles: ${result.supportedRoles.join(', ')}`);
    if (result.timeLockPeriod) console.log(`   ⏰ Time Lock: ${result.timeLockPeriod} seconds`);
  });
}

// Run the Guardian initialization check
checkAllGuardianContracts()
  .then(() => {
    console.log('\n✅ Guardian initialization check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Guardian initialization check failed:', error);
    process.exit(1);
  });
