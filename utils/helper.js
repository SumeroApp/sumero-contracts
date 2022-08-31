const hre = require("hardhat");

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


function getTxUrl(network, txHash) {
    if (!isLocalNetwork() && isForkedNetwork()) {
        let txLink = "https://" + network.name + ".etherscan.io/tx/" + txHash
        return "Etherscan URL: " + txLink;
    }
    return null;
}

async function iterateAssets(numOfAssets, mappingName, contract) {
    for (let i = 0; i < numOfAssets; ++i) {
        const asset = await contract[mappingName](i + 1);
        console.log(colors.blue("\n address: " + asset.addr));
        console.log(colors.blue(" status: " + asset.status));
    }
}

module.exports = {
    isLocalNetwork,
    isForkedNetwork,
    matchesForkedNetwork,
    getTxUrl,
    iterateAssets
}