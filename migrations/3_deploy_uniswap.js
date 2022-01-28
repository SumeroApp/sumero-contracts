// helper functions
const { isDevNetwork, isZeroAddress } = require("../helpers");

// test contracts
const MockERC20 = artifacts.require('MockERC20.sol');
const WETH = artifacts.require("WETH.sol");

// Uniswap
const Factory = artifacts.require('uniswapv2/UniswapV2Factory.sol');
const Router = artifacts.require('uniswapv2/UniswapV2Router02.sol');

// Clay Token
const ClayToken = artifacts.require('ClayToken.sol');

// Deploy Uniswap Contracts
module.exports = async (deployer, network, accounts) => {
    let FACTORY_ADDRESS = '';
    let WETH_ADDRESS = '';
    let TOKEN_A_ADDRESS = '';
    let CLAY_TOKEN_ADDRESS = '';
    let WETH_TOKEN_A_PAIR = '';
    let WETH_CLAY_TOKEN_PAIR = '';

    // local ganache instance
    if (isDevNetwork('development')) {

        // mock ERC20 Token
        // new() used to deploy multiple instances of a contract
        // contracts deployed via new() are not tracked in truffle migrations contract
        const tokenA = await MockERC20.new('Token A', 'TKA', web3.utils.toWei('100000', 'ether'));
        TOKEN_A_ADDRESS = tokenA.address;
        console.log("TOKEN A ADDRESS: " + TOKEN_A_ADDRESS)

        // WETH 
        // only for local development enviornment
        await deployer.deploy(WETH);
        weth = await WETH.deployed();
        WETH_ADDRESS = weth.address;
        console.log("WETH ADDRESS: " + WETH_ADDRESS)

        // Uniswap Factory 
        await deployer.deploy(Factory, accounts[0]);
        const factory = await Factory.deployed();
        FACTORY_ADDRESS = factory.address;
        console.log("FACTORY ADDRESS: " + FACTORY_ADDRESS)

        // Uniswap Router
        const router = await deployer.deploy(Router, FACTORY_ADDRESS, WETH_ADDRESS);

        // Create Swap Pairs via Uniswap Router
        CLAY_TOKEN_ADDRESS = (await ClayToken.deployed()).address

        // WETH <=> TOKEN A PAIR
        const wethTokenAPairTX = await factory.createPair(WETH_ADDRESS, TOKEN_A_ADDRESS);
        WETH_TOKEN_A_PAIR = await router.getPair(WETH_ADDRESS, TOKEN_A_ADDRESS);

        if (isZeroAddress(WETH_TOKEN_A_PAIR)) {
            console.log("WETH_TOKEN_A_PAIR Contract NOT FOUND");
        } else {
            console.log("WETH_TOKEN_A_PAIR: " + WETH_TOKEN_A_PAIR)
        }

        // WETH <=> CLAY TOKEN PAIR
        const wethClayTokenPairTX = await factory.createPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);
        WETH_CLAY_TOKEN_PAIR = await router.getPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);

        if (isZeroAddress(WETH_CLAY_TOKEN_PAIR)) {
            console.log("WETH_CLAY_TOKEN_PAIR Contract NOT FOUND");
        } else {
            console.log("WETH_CLAY_TOKEN_PAIR: " + WETH_CLAY_TOKEN_PAIR)
        }
    }


    //kovan testnet

    // mainnet
}