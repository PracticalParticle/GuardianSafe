// SPDX-License-Identifier: MPL-2.0
// Script to get deployed contract addresses

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

/**
 * @dev Extracts deployed contract addresses from Truffle migration artifacts
 */
function getDeployedAddresses() {
  console.log('🔍 Searching for deployed contract addresses...\n');
  
  const buildDir = path.join(__dirname, '../build/contracts');
  const addresses = {};
  
  try {
    // Check if build directory exists
    if (!fs.existsSync(buildDir)) {
      console.log('❌ Build directory not found. Please run "npm run compile:truffle" first.');
      return null;
    }
    
    // Read contract artifacts
    const contractFiles = fs.readdirSync(buildDir);
    
    for (const file of contractFiles) {
      if (file.endsWith('.json')) {
        const contractName = file.replace('.json', '');
        const artifactPath = path.join(buildDir, file);
        
        try {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          
          // Check if contract has deployed addresses
          if (artifact.networks) {
            for (const [networkId, networkData] of Object.entries(artifact.networks)) {
              if (networkData.address) {
                if (!addresses[networkId]) {
                  addresses[networkId] = {};
                }
                addresses[networkId][contractName] = networkData.address;
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not read artifact for ${contractName}:`, error.message);
        }
      }
    }
    
    return addresses;
    
  } catch (error) {
    console.error('❌ Error reading contract artifacts:', error.message);
    return null;
  }
}

/**
 * @dev Displays deployed addresses in a formatted way
 */
function displayAddresses(addresses) {
  if (!addresses || Object.keys(addresses).length === 0) {
    console.log('❌ No deployed contracts found.');
    console.log('\n📋 To deploy contracts, run:');
    console.log('   npm run deploy:guardian');
    return;
  }
  
  console.log('✅ Deployed Contract Addresses:\n');
  
  for (const [networkId, contracts] of Object.entries(addresses)) {
    console.log(`🌐 Network ID: ${networkId}`);
    console.log('─'.repeat(50));
    
    // Group contracts by type
    const definitionLibraries = {};
    const guardianContracts = {};
    const otherContracts = {};
    
    for (const [contractName, address] of Object.entries(contracts)) {
      if (contractName.includes('Definitions') || contractName.includes('BaseDefinitionLoader')) {
        definitionLibraries[contractName] = address;
      } else if (contractName.includes('Guardian')) {
        guardianContracts[contractName] = address;
      } else {
        otherContracts[contractName] = address;
      }
    }
    
    // Display definition libraries
    if (Object.keys(definitionLibraries).length > 0) {
      console.log('📚 Definition Libraries:');
      for (const [name, address] of Object.entries(definitionLibraries)) {
        console.log(`   ${name}: ${address}`);
      }
      console.log('');
    }
    
    // Display Guardian contracts
    if (Object.keys(guardianContracts).length > 0) {
      console.log('🛡️ Guardian Contracts:');
      for (const [name, address] of Object.entries(guardianContracts)) {
        console.log(`   ${name}: ${address}`);
      }
      console.log('');
    }
    
    // Display other contracts
    if (Object.keys(otherContracts).length > 0) {
      console.log('📦 Other Contracts:');
      for (const [name, address] of Object.entries(otherContracts)) {
        console.log(`   ${name}: ${address}`);
      }
      console.log('');
    }
  }
}

/**
 * @dev Generates configuration file with deployed addresses
 */
function generateConfigFile(addresses) {
  if (!addresses || Object.keys(addresses).length === 0) {
    return;
  }
  
  console.log('📝 Generating configuration file...\n');
  
  // Find the most recent network (highest network ID)
  const networkIds = Object.keys(addresses).map(id => parseInt(id)).sort((a, b) => b - a);
  const latestNetworkId = networkIds[0];
  const latestContracts = addresses[latestNetworkId.toString()];
  
  if (!latestContracts) {
    console.log('❌ No contracts found for latest network.');
    return;
  }
  
  // Extract definition library addresses
  const config = {
    definitionLibraries: {
      MultiPhaseSecureOperationDefinitions: latestContracts.MultiPhaseSecureOperationDefinitions || '0x0000000000000000000000000000000000000000',
      SecureOwnableDefinitions: latestContracts.SecureOwnableDefinitions || '0x0000000000000000000000000000000000000000',
      DynamicRBACDefinitions: latestContracts.DynamicRBACDefinitions || '0x0000000000000000000000000000000000000000',
      BaseDefinitionLoader: latestContracts.BaseDefinitionLoader || '0x0000000000000000000000000000000000000000'
    },
    guardianContracts: {
      GuardianAccountAbstraction: latestContracts.GuardianAccountAbstraction || '0x0000000000000000000000000000000000000000',
      GuardianAccountAbstractionWithRoles: latestContracts.GuardianAccountAbstractionWithRoles || '0x0000000000000000000000000000000000000000'
    },
    network: {
      chainId: latestNetworkId,
      rpcUrl: process.env.REMOTE_HOST ? `http://${process.env.REMOTE_HOST}:${process.env.REMOTE_PORT || '8545'}` : 'http://127.0.0.1:8545'
    }
  };
  
  // Write config file
  const configPath = path.join(__dirname, '../deployed-addresses.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Configuration saved to:', configPath);
  console.log('\n📋 Usage in your analyzer:');
  console.log('```typescript');
  console.log('import { DEFAULT_CONFIG } from "./Configuration"');
  console.log('import deployedAddresses from "./deployed-addresses.json"');
  console.log('');
  console.log('const config = updateConfigWithDeployedAddresses(');
  console.log('  DEFAULT_CONFIG,');
  console.log('  deployedAddresses.definitionLibraries');
  console.log(');');
  console.log('```');
}

/**
 * @dev Main execution
 */
function main() {
  console.log('🚀 Guardian Contract Address Extractor\n');
  
  const addresses = getDeployedAddresses();
  displayAddresses(addresses);
  generateConfigFile(addresses);
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Deploy contracts: npm run deploy:guardian');
  console.log('2. Run this script again to get addresses');
  console.log('3. Update your analyzer configuration');
  console.log('4. Use RealContractDefinitionAnalyzer for real contract analysis');
}

// Run the script
main();
