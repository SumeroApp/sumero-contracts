const { node_url, accounts, addForkConfiguration } = require('./utils/network');
// requiring these here, automatically adds ethers, deploy to HRE (Hardhat Runtime Env.)
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require( "./tasks/clay-balance");
require( "./tasks/clay-mint");
require( "./tasks/add-liq");
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: addForkConfiguration({
    localhost: {
      live: false,
      tags: ["local"],
      hardfork: "istanbul",
      blockGasLimit: 67000000,
    },
    kovan: {
      live: true,
      tags: ["staging"],
      blockGasLimit: 67000000,
      url: node_url('kovan'),
      accounts: accounts('kovan'),
      chainId: 42,
    },
  }),
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      }
    },
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    sumeroTestUser: {
      default: 1
    }
  },
  external: process.env.HARDHAT_FORK
    ? {
      deployments: {
        // process.env.HARDHAT_FORK will specify the network that the fork is made from.
        // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
        hardhat: ['deployments/' + process.env.HARDHAT_FORK],
        localhost: ['deployments/' + process.env.HARDHAT_FORK],
      },
    }
    : undefined,
};
