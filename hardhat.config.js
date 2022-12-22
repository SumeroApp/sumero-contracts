const { node_url, accounts, addForkConfiguration } = require('./utils/network');
// requiring these here, automatically adds ethers, deploy to HRE (Hardhat Runtime Env.)
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
// require("hardhat-deploy");
require("./tasks/clay-balance");
require("./tasks/clay-mint");
require("./tasks/clay-approve");
require("./tasks/clay-get-allowance");
require("./tasks/erc20-approve");
require("./tasks/add-liquidity");
require("./tasks/clay-grant-role");
require("./tasks/add-asset");
require("./tasks/pause-asset");
require("./tasks/unpause-asset");
require("./tasks/close-asset");
require("./tasks/list-assets");
require("./tasks/emp-create");
require("./tasks/emp-mint");
require("./tasks/emp-expire");
require("./tasks/emp-settle");
require("./tasks/emp-request-withdrawal");
require("./tasks/add-impl-to-finder");
require("./tasks/create-lp");
require("./tasks/setup-finder");
require("hardhat-gas-reporter");

const solcVersion = "0.8.0";

const LARGE_CONTRACT_COMPILER_SETTINGS = {
  version: solcVersion,
  settings: { optimizer: { enabled: true, runs: 200 } },
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  // truffle dashboard doesn't work properly with Fork Configuration
  // commenting for now
  // networks: addForkConfiguration({
  // }),
  networks: {
    localhost: {
      live: false,
      tags: ["local"],
      hardfork: "istanbul",
      blockGasLimit: 67000000,
    },
    kovan: {
      live: false,
      tags: ["test-kovan"],
      blockGasLimit: 67000000,
      url: node_url('kovan'),
      accounts: accounts('kovan'),
      chainId: 42,
    },
    goerli: {
      live: true,
      tags: ["test-goerli"],
      blockGasLimit: 67000000,
      url: node_url('goerli'),
      accounts: accounts('goerli'),
      chainId: 5,
    },
    'dashboard': {
      url: "http://localhost:24012/rpc",
      timeout: 400000,
      live: true
    }
  },
  solidity: {
    compilers: [
      // For Uniswap contracts
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          }
        },
      },
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          }
        },
      },
      // {
      //   version: "0.8.1",
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 20,
      //     }
      //   },
      // },
      // {
      //   version: "0.8.9",
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 20,
      //     }
      //   },
      // }
    ],
    // overrides: {
    //   "contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiPartyLib.sol": {
    //     version: "0.8.0",
    //     settings: { optimizer: { enabled: true, runs: 200 } },
    //   },
    // }
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
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: true,
    currency: "ETH",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true,
  },
};
