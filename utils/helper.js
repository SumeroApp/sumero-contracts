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

module.exports = {
    isLocalNetwork,
    isForkedNetwork,
    matchesForkedNetwork
}