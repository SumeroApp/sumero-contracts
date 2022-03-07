// helpers
const { isDevNetwork } = require("../helpers");

const ClayToken = artifacts.require('ClayToken.sol');

const { assert } = require("chai");

const getString = async (val) => await val.toString()


// Deploy ERC20 CLAY TOKEN (CLAY)
module.exports = async (deployer, network, accounts) => {
    // local ganache instance
    if (isDevNetwork('development')) {
        await deployer.deploy(ClayToken);
        const clayToken = await ClayToken.deployed();
        // deployed address -> 0xC25cb1B28234f6859803496B83A7c84914c90af4

        // mint CLAY token to accounts[0]
        await clayToken.mint(accounts[0], web3.utils.toWei('800000', 'ether'));
        const clayTokenBalance = await clayToken.balanceOf(accounts[0]);

        assert.equal(web3.utils.fromWei(clayTokenBalance), '800000', "Clay Token Balance doesn't match");

        // mint CLAY token to metamask wallet address
        await clayToken.mint("0xC5E82E6b45609793da42aE8c1bb1B02FAb4f2514", web3.utils.toWei('800000', 'ether'));
        const metamaskAddressBalance = await clayToken.balanceOf(accounts[0]);

        assert.equal(web3.utils.fromWei(metamaskAddressBalance), '800000', "Clay Token Balance doesn't match");
    }


    //kovan testnet

    // mainnet
}