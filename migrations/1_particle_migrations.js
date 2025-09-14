const MPS = artifacts.require("MultiPhaseSecureOperation");
const SOD = artifacts.require("SecureOwnableDefinitions");
const PAA = artifacts.require("GuardianAccountAbstraction");

module.exports = async function(deployer, network, accounts) {
    // Deploy MultiPhaseSecureOperation first
    let mps = await deployer.deploy(MPS);
    
    // Link MPS to SecureOwnableDefinitions
    await deployer.link(MPS, SOD);
    
    // Deploy SecureOwnableDefinitions
    let sod = await deployer.deploy(SOD);
    
    // Link libraries to GuardianAccountAbstraction
    await deployer.link(MPS, PAA);
    await deployer.link(SOD, PAA);
    
    // Deploy GuardianAccountAbstraction (no constructor parameters)
    let paa = await deployer.deploy(PAA);
    
    // Initialize the contract with required parameters
    let currentAccount = accounts[0];
    let recoveryAddress = accounts[1];
    let timeLockPeriod = 60; // 60 minutes timelock period
    let broadcasterAddress = accounts[2];
    
    // Call the initialize function
    await paa.initialize(
        currentAccount,
        broadcasterAddress,
        recoveryAddress,
        timeLockPeriod
    );
};
