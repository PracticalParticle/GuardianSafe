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
    
    // Deploy GuardianAccountAbstraction with required parameters
    let currentAccount = accounts[0];
    let recoveryAddress = accounts[1];
    let timeLockPeriod = 60; // 60 minutes timelock period
    let broadcasterAddress = accounts[2];
    
    await deployer.deploy(
        PAA,
        currentAccount,
        broadcasterAddress,
        recoveryAddress,
        timeLockPeriod
    );
    let paa = await PAA.deployed();
};
