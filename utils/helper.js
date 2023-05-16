const hre = require("hardhat");
const { ethers } = require("hardhat");
const fetch = require('node-fetch');
const colors = require('colors');

function getEpochFromDate(date) {
    if (!(date instanceof Date)) {
        throw new Error("getEpochFromDate(): given value is not a date object");
    }
    return Math.round(new Date(date).getTime() / 1000)
}

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
function getTxUrl(networkName, txHash) {
    if (!isLocalNetwork() && !isForkedNetwork() && txHash) {
        let txLink = "https://" + networkName + ".etherscan.io/tx/" + txHash
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
    return '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
    if (network.name === 'kovan') {
        return "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
    } else if (network.name === "goerli" || network.name === "dashboard-goerli") {
        return "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    }
    else {
        throw new Error(`Unable to find WETH Address for network ${network.name}`);
    }
}

function getUsdcOrThrow(network) {
    return '0x07865c6E87B9F70255377e024ace6630C1Eaa37F'
    if (network.name === 'kovan') {
        return "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede";
    } else if (network.name === "goerli" || network.name === "dashboard-goerli") {
        return "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
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

// Price Identifier Helper
function unhexlify(hexlified) {
    const unhexed = ethers.utils.toUtf8String(hexlified);
    const unpadded = unhexed.replace(/\0.*$/, "");
    return unpadded;
    // const hexed = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(priceIdentifier));
    // return hexed.padEnd(66, '0');
}

function tryDecodeAncillaryDataSynthId(hexlifiedAncillaryData) {
    try {
        let ancillaryData = unhexlify(hexlifiedAncillaryData);
        // synthID: "DXY", q:....
        let isolatedAndStripped = ancillaryData.split(',')[0].replace(/\s+/g, '');
        if (isolatedAndStripped.substring(0, 8) != "synthID:") {
            throw "ancillaryData does not start with 'synthID:'";
        }
        let quoted = isolatedAndStripped.substring(8);
        let parsedIdentifier = JSON.parse(quoted);
        console.log('decoded ancillaryData synthID to ' + parsedIdentifier);
        return parsedIdentifier;
    }
    catch (e) {
        console.log('Encountered NUMERICAL, but error decoding priceIdentifier from ancillaryData:', e);
        return undefined;
    }
}

function getConvertedPriceIdentifier(hexlifiedPriceIdentifier, hexlifiedAncillaryData) {
    const priceIdentifierConversions = { // maps Uma price identifiers to the price server's identifiers. Only needed if they don't already match.
        'btc/usd': 'btcusd'
    }
    let priceIdentifier = unhexlify(hexlifiedPriceIdentifier);

    if (priceIdentifier == "NUMERICAL") {
        let maybePriceIdentifier = tryDecodeAncillaryDataSynthId(hexlifiedAncillaryData);
        if (!maybePriceIdentifier) {
            return undefined;
        }
        else {
            priceIdentifier = maybePriceIdentifier;
        }
    }

    const loweredUmaIdentitifer = priceIdentifier.toLowerCase();
    return priceIdentifierConversions[loweredUmaIdentitifer] || loweredUmaIdentitifer;
}

async function getPriceFromIdentifier(hexlifiedPriceIdentifier, hexlifiedAncillaryData) {
    let price = "";
    const fetchUrl = "https://prices.sumero.finance/prices.json";
    const loweredIdentifier = getConvertedPriceIdentifier(hexlifiedPriceIdentifier, hexlifiedAncillaryData);

    console.log("Fetching Price from Feed: ");

    const responseData = await fetch(fetchUrl)
        .then((response) => {
            return response.json();
        });

    price = responseData[loweredIdentifier];
    if (!price || price === "") throw "Fetch Price Feed Empty";

    console.log(loweredIdentifier + ": " + price);
    return price;
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
    getAddressUrl,
    getPriceFromIdentifier,
    getEpochFromDate,
}