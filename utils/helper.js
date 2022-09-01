const hre = require("hardhat");

// Network Helpers
function isLocalNetwork() {
    return (hre.network.name == 'localhost' || hre.network.name == 'hardhat') ? true : false;
}

function isForkedNetwork() {
    return (hre.config.networks.hardhat.forking) ? true : false;
}

function getForkedNetwork() {
    if (isForkedNetwork()) {
        const url = hre.config.networks.hardhat.forking.url;

        if (url.includes('kovan')) return 'kovan';
        if (url.includes('ropsten')) return 'ropsten';
        if (url.includes('rinkeby')) return 'rinkeby';
        if (url.includes('mainnet')) return 'mainnet';
    }
    return null;
}

function matchesForkedNetwork(name) {
    return (getForkedNetwork() == name) ? true : false;
}

// Transaction Helper
function getTxUrl(network, txHash) {
    if (!isLocalNetwork() && isForkedNetwork()) {
        let txLink = "https://" + network.name + ".etherscan.io/tx/" + txHash
        return "Etherscan URL: " + txLink;
    }
    return null;
}

// Bonds contract Helper
async function iterateAssets(numOfAssets, mappingName, contract) {
    for (let i = 0; i < numOfAssets; ++i) {
        const asset = await contract[mappingName](i + 1);
        console.log(colors.blue("\n address: " + asset.addr));
        console.log(colors.blue(" status: " + asset.status));
    }
}

// Contracts Address Helper
function getWethAddressOrThrow(network) {
    if (network.name === 'kovan') {
        return "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
    } else if (network.name === "goerli") {
        return "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    }
    else {
        throw new Error(`Unable to find WETH Address for network ${network.name}`);
    }
}

function getUsdcOrThrow(network) {
    if (network.name === 'kovan') {
        return "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede";
    } else if (network.name === "goerli") {
        return "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
    }
    else {
        throw new Error(`Unable to find USDC Address for network ${network.name}`);
    }
}

// ============ Address Helper Functions ============
function isZeroAddress(address) {
    return (address === '0x0000000000000000000000000000000000000000');
}

function getAddressUrl(network, url) {
    if (!isLocalNetwork() && isForkedNetwork()) {
        let addressUrl = "https://" + network.name + ".etherscan.io/address/" + url
        return "Etherscan Address URL: " + addressUrl;
    }
    return null;
}

module.exports = {
    isLocalNetwork,
    isForkedNetwork,
    matchesForkedNetwork,
    getTxUrl,
    iterateAssets,
    getWethAddressOrThrow,
    getUsdcOrThrow,
    isZeroAddress,
    getAddressUrl
}