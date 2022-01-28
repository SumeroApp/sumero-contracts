// helpers
const { isDevNetwork } = require("../helpers");

const ClayToken = artifacts.require('ClayToken.sol');

// Deploy ERC20 CLAY TOKEN (CLAY)
module.exports = async (deployer, network, accounts) => {
    // local ganache instance
    if(isDevNetwork('development')) {
        await deployer.deploy(ClayToken);
        const clayToken = await ClayToken.deployed();
        // deployed address -> 0xC25cb1B28234f6859803496B83A7c84914c90af4
    }


    //kovan testnet

    // mainnet
}