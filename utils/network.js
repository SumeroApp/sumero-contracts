require('dotenv/config');

function node_url(networkName) {
    if (networkName) {
        const uri = process.env['ETH_NODE_URI_' + networkName.toUpperCase()];
        if (uri && uri !== '') {
            return uri;
        }
    }

    if (networkName === 'localhost') {
        // do not use ETH_NODE_URI
        return 'http://localhost:8545';
    }

    let uri = process.env.ETH_NODE_URI;
    if (uri) {
        uri = uri.replace('{{networkName}}', networkName);
    }
    if (!uri || uri === '') {
        // throw new Error(`environment variable "ETH_NODE_URI" not configured `);
        return '';
    }
    if (uri.indexOf('{{') >= 0) {
        throw new Error(`invalid uri or network not supported by node provider : ${uri}`);
    }
    return uri;
}

function getMnemonic(networkName) {
    if (networkName) {
        const mnemonic = process.env['MNEMONIC_' + networkName.toUpperCase()];
        if (mnemonic && mnemonic !== '') {
            return mnemonic;
        }
    }

    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic || mnemonic === '') {
        return 'test test test test test test test test test test test junk';
    }
    return mnemonic;
}

function accounts(networkName) {
    return { mnemonic: getMnemonic(networkName) };
}

function addForkConfiguration(networks) {
    // While waiting for hardhat PR: https://github.com/nomiclabs/hardhat/pull/1542
    if (process.env.HARDHAT_FORK) {
        process.env['HARDHAT_DEPLOY_FORK'] = process.env.HARDHAT_FORK;
    }

    const currentNetworkName = process.env.HARDHAT_FORK;
    let forkURL = currentNetworkName && node_url(currentNetworkName);
    let hardhatAccounts;
    if (currentNetworkName && currentNetworkName !== 'hardhat') {
        const currentNetwork = networks[currentNetworkName];
        if (currentNetwork) {
            forkURL = currentNetwork.url;
            if (
                currentNetwork.accounts &&
                typeof currentNetwork.accounts === 'object' &&
                'mnemonic' in currentNetwork.accounts
            ) {
                hardhatAccounts = currentNetwork.accounts;
            }
        }
    }

    const newNetworks = {
        ...networks,
        hardhat: {
            ...networks.hardhat,
            ...{
                accounts: hardhatAccounts,
                forking: forkURL
                    ? {
                        url: forkURL,
                        blockNumber: process.env.HARDHAT_FORK_NUMBER ? parseInt(process.env.HARDHAT_FORK_NUMBER) : undefined,
                    }
                    : undefined,
                mining: process.env.MINING_INTERVAL
                    ? {
                        auto: false,
                        interval: process.env.MINING_INTERVAL.split(',').map((v) => parseInt(v)),
                    }
                    : undefined,
            },
        },
    };
    return newNetworks;
}
const chainIdToServiceUrl = {
    1: 'https://safe-transaction-mainnet.safe.global',
    5: 'https://safe-transaction-goerli.safe.global',
  }

module.exports = {
    node_url,
    accounts,
    addForkConfiguration,
    chainIdToServiceUrl,
}