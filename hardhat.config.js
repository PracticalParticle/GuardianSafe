require("@nomicfoundation/hardhat-toolbox");
require("solidity-docgen");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      // Configuration for the built-in Hardhat Network
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
    templates: './docgen/templates',
  },
  libraries: {
    TokenInventoryLib: "0x0000000000000000000000000000000000000000" // Placeholder address
  }
};