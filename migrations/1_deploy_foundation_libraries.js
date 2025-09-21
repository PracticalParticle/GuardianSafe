// Migration 1: Deploy Core Libraries and Definition Libraries (Foundation)
const MPS = artifacts.require("MultiPhaseSecureOperation");
const MPSD = artifacts.require("MultiPhaseSecureOperationDefinitions");
const SOD = artifacts.require("SecureOwnableDefinitions");
const DRD = artifacts.require("DynamicRBACDefinitions");

module.exports = async function(deployer, network, accounts) {
    console.log(`🚀 Migration 1: Deploying Foundation Libraries on ${network}`);
    console.log(`📋 Using account: ${accounts[0]}`);
    
    // Step 1: Deploy core libraries (no dependencies)
    console.log("\n📦 Step 1: Deploying Core Libraries...");
    
    // Deploy MultiPhaseSecureOperation (core library)
    await deployer.deploy(MPS);
    const mps = await MPS.deployed();
    console.log("✅ MultiPhaseSecureOperation deployed at:", mps.address);
    
    // Step 2: Deploy definition libraries (depend on core libraries)
    console.log("\n📦 Step 2: Deploying Definition Libraries...");
    
    // Deploy MultiPhaseSecureOperationDefinitions (no linking needed - it's a library)
    await deployer.deploy(MPSD);
    const mpsd = await MPSD.deployed();
    console.log("✅ MultiPhaseSecureOperationDefinitions deployed at:", mpsd.address);
    
    // Deploy SecureOwnableDefinitions (no linking needed - it's a library)
    await deployer.deploy(SOD);
    const sod = await SOD.deployed();
    console.log("✅ SecureOwnableDefinitions deployed at:", sod.address);
    
    // Deploy DynamicRBACDefinitions (no linking needed - it's a library)
    await deployer.deploy(DRD);
    const drd = await DRD.deployed();
    console.log("✅ DynamicRBACDefinitions deployed at:", drd.address);
    
    console.log("\n🎉 Migration 1 completed successfully!");
    console.log("📋 Foundation Libraries Deployed:");
    console.log(`   MultiPhaseSecureOperation: ${mps.address}`);
    console.log(`   MultiPhaseSecureOperationDefinitions: ${mpsd.address}`);
    console.log(`   SecureOwnableDefinitions: ${sod.address}`);
    console.log(`   DynamicRBACDefinitions: ${drd.address}`);
    console.log("\n🎯 Ready for Migration 2: Guardian Contracts");
};
