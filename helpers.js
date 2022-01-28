// ============ Network Helper Functions ============

function isDevNetwork(network) {
    verifyNetwork(network);
    return (
        network.startsWith('development') ||
        network.startsWith('test') ||
        network.startsWith('test_ci') ||
        network.startsWith('develop') ||
        network.startsWith('dev') ||
        network.startsWith('docker') ||
        network.startsWith('coverage')
    );
}

function isMainNet(network) {
    verifyNetwork(network);
    return network.startsWith('mainnet');
}

function isKovan(network) {
    verifyNetwork(network);
    return network.startsWith('kovan');
}

function isDocker(network) {
    verifyNetwork(network);
    return network.startsWith('docker');
}

function verifyNetwork(network) {
    if (!network) {
        throw new Error('No network provided');
    }
}

// ============ Address Helper Functions ============
function isZeroAddress(address) {
    return (address === '0x0000000000000000000000000000000000000000');
}

module.exports = {
    isDevNetwork,
    isMainNet,
    isKovan,
    isDocker,
    isZeroAddress
};