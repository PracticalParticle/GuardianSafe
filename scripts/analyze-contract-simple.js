// SPDX-License-Identifier: MPL-2.0
// Simple Dynamic Contract Analysis Script

const { createPublicClient, http } = require('viem');

// Load environment variables
require('dotenv').config();

// Network configuration - dynamic development network
const NETWORK_CONFIG = {
  id: parseInt(process.env.CUSTOM_NETWORK_ID || process.env.REMOTE_NETWORK_ID) || 1337,
  name: process.env.CUSTOM_NETWORK_NAME || process.env.GUARDIAN_NETWORK || 'development',
  rpcUrls: {
    default: { 
      http: [
        process.env.CUSTOM_RPC_URL || 
        `http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`
      ] 
    },
    public: { 
      http: [
        process.env.CUSTOM_RPC_URL || 
        `http://${process.env.REMOTE_HOST || '127.0.0.1'}:${process.env.REMOTE_PORT || '8545'}`
      ] 
    }
  },
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
};

// Definition library configuration from environment
const DEFINITION_LIBRARIES = {
  MultiPhaseSecureOperationDefinitions: process.env.MULTIPHASE_DEFINITIONS_ADDRESS || '0x0a38383369060f374601Ea29aAFB75300458e2D7',
  SecureOwnableDefinitions: process.env.SECURE_OWNABLE_DEFINITIONS_ADDRESS || '0x258ffE4fFcAfC08B0fEeB058eE855dc6adb5AF6A',
  DynamicRBACDefinitions: process.env.DYNAMIC_RBAC_DEFINITIONS_ADDRESS || '0x58C3D2b67f9F8c41855C5060A94a593885843674'
};

// Contract addresses from environment or command line
const CONTRACT_ADDRESSES = {
  GuardianAccountAbstraction: process.env.GUARDIAN_ACCOUNT_ABSTRACTION_ADDRESS || '0xabd688943c065dEB475D7d1c5c829d18aEE185e7',
  GuardianAccountAbstractionWithRoles: process.env.GUARDIAN_ACCOUNT_ABSTRACTION_WITH_ROLES_ADDRESS || '0x0665417be6D5638AF01776593b4d2474Cb944aa9',
  SimpleVault: process.env.SIMPLE_VAULT_ADDRESS || '0x0542b24b51F7Eac9454A26E1ce3d4F30a8D72ce3',
  SimpleRWA20: process.env.SIMPLE_RWA20_ADDRESS || '0x83b72B5C89Dbf53C7560A258aa0Babb77e207A92'
};

async function testContractFunctions(client, contractAddress, contractName) {
  console.log(`🔍 Testing ${contractName}:`);
  console.log(`   Address: ${contractAddress}`);
  
  const functions = [
    'getSupportedOperationTypes',
    'getSupportedFunctions',
    'transferOwnershipRequest',
    'updateRoleEditingToggleRequestAndApprove',
    'txRequest',
    'owner',
    'getBroadcaster',
    'getRecovery'
  ];
  
  const availableFunctions = [];
  
  for (const funcName of functions) {
    try {
      await client.readContract({
        address: contractAddress,
        abi: [{
          inputs: [],
          name: funcName,
          outputs: [{ name: '', type: 'bytes' }],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: funcName
      });
      availableFunctions.push(funcName);
      console.log(`   ✅ ${funcName}`);
    } catch (error) {
      console.log(`   ❌ ${funcName}: ${error.message.split('\n')[0]}`);
    }
  }
  
  console.log(`   📊 Available functions: ${availableFunctions.length}/${functions.length}`);
  console.log('');
  
  return availableFunctions;
}

async function testDefinitionLibraries(client) {
  console.log('🔍 Testing Definition Libraries:');
  console.log('================================');
  
  for (const [libraryName, libraryAddress] of Object.entries(DEFINITION_LIBRARIES)) {
    console.log(`\n📚 ${libraryName}:`);
    console.log(`   Address: ${libraryAddress}`);
    
    try {
      // Test getOperationTypes
      const operationTypes = await client.readContract({
        address: libraryAddress,
        abi: [{
          inputs: [],
          name: 'getOperationTypes',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'operationType', type: 'bytes32' },
            { name: 'name', type: 'string' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getOperationTypes'
      });
      
      console.log(`   ✅ getOperationTypes: ${operationTypes.length} types`);
      if (operationTypes.length > 0) {
        operationTypes.slice(0, 3).forEach((type, index) => {
          console.log(`      ${index + 1}. ${type.name}`);
        });
        if (operationTypes.length > 3) {
          console.log(`      ... and ${operationTypes.length - 3} more`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ getOperationTypes: ${error.message.split('\n')[0]}`);
    }
    
    try {
      // Test getFunctionSchemas
      const functionSchemas = await client.readContract({
        address: libraryAddress,
        abi: [{
          inputs: [],
          name: 'getFunctionSchemas',
          outputs: [{ name: '', type: 'tuple[]', components: [
            { name: 'functionName', type: 'string' },
            { name: 'functionSelector', type: 'bytes4' },
            { name: 'operationType', type: 'bytes32' },
            { name: 'supportedActions', type: 'uint8[]' }
          ]}],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'getFunctionSchemas'
      });
      
      console.log(`   ✅ getFunctionSchemas: ${functionSchemas.length} schemas`);
      if (functionSchemas.length > 0) {
        functionSchemas.slice(0, 3).forEach((schema, index) => {
          console.log(`      ${index + 1}. ${schema.functionName}`);
        });
        if (functionSchemas.length > 3) {
          console.log(`      ... and ${functionSchemas.length - 3} more`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ getFunctionSchemas: ${error.message.split('\n')[0]}`);
    }
  }
}

async function analyzeAllContracts() {
  console.log('🚀 Dynamic Guardian Contract Analysis\n');
  
  console.log('📋 Configuration:');
  console.log(`   Network: ${NETWORK_CONFIG.name} (ID: ${NETWORK_CONFIG.id})`);
  console.log(`   RPC URL: ${NETWORK_CONFIG.rpcUrls.default.http[0]}`);
  console.log('   Definition Libraries:');
  Object.entries(DEFINITION_LIBRARIES).forEach(([name, address]) => {
    console.log(`     ${name}: ${address}`);
  });
  console.log('');
  
  // Create Viem client
  const client = createPublicClient({
    chain: NETWORK_CONFIG,
    transport: http()
  });
  
  // Test definition libraries
  await testDefinitionLibraries(client);
  
  // Test contracts
  console.log('🔍 Testing Contracts:');
  console.log('====================');
  
  const results = [];
  
  for (const [contractName, contractAddress] of Object.entries(CONTRACT_ADDRESSES)) {
    const functions = await testContractFunctions(client, contractAddress, contractName);
    results.push({
      contractName,
      contractAddress,
      availableFunctions: functions
    });
  }
  
  // Summary
  console.log('📊 Analysis Summary:');
  console.log('==================');
  
  results.forEach(result => {
    const name = result.contractName.padEnd(35);
    const hasSupportedOps = result.availableFunctions.includes('getSupportedOperationTypes') ? '✅' : '❌';
    const hasSupportedFuncs = result.availableFunctions.includes('getSupportedFunctions') ? '✅' : '❌';
    const functionCount = result.availableFunctions.length.toString().padStart(2);
    
    console.log(`${name} | SupportedOps: ${hasSupportedOps} | SupportedFuncs: ${hasSupportedFuncs} | Functions: ${functionCount}`);
  });
  
  const totalContracts = results.length;
  const hasSupportedOps = results.filter(r => r.availableFunctions.includes('getSupportedOperationTypes')).length;
  const hasSupportedFuncs = results.filter(r => r.availableFunctions.includes('getSupportedFunctions')).length;
  
  console.log('\n🎯 Overall Status:');
  console.log(`   Total Contracts: ${totalContracts}`);
  console.log(`   ✅ Have Supported Operations: ${hasSupportedOps}`);
  console.log(`   ✅ Have Supported Functions: ${hasSupportedFuncs}`);
  
  if (hasSupportedOps === totalContracts && hasSupportedFuncs === totalContracts) {
    console.log('\n🎉 All contracts are Guardian-compatible!');
  } else {
    console.log('\n⚠️  Some contracts may not be Guardian-compatible.');
  }
  
  console.log('\n✅ Dynamic analysis completed');
}

// Run the analysis
analyzeAllContracts()
  .then(() => {
    console.log('\n✅ All analyses completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
