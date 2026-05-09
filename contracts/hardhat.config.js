require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // BSC Testnet
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.BSC_TESTNET_PRIVATE_KEY ? [process.env.BSC_TESTNET_PRIVATE_KEY] : []
    },
    // TRON Shasta Testnet (需要使用特殊配置)
    tronShasta: {
      url: "https://api.shasta.trongrid.io",
      // TRON 使用 TronWeb，需要特殊处理
    }
  },
  paths: {
    sources: "./escrow",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};