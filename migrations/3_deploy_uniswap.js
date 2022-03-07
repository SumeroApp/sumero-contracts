// helper functions
const { assert } = require("chai");
const { isDevNetwork, isZeroAddress } = require("../helpers");

// test contracts
const MockERC20 = artifacts.require('MockERC20.sol');
const WETH = artifacts.require("WETH.sol");
const USDC = artifacts.require("USDC.sol");

// Uniswap
const Factory = artifacts.require('uniswapV2/UniswapV2Factory.sol');
const Router = artifacts.require('uniswapV2/UniswapV2Router02.sol');
const Pair = artifacts.require('uniswapV2/UniswapV2Pair.sol');

// Clay Token
const ClayToken = artifacts.require('ClayToken.sol');

// Deploy Uniswap Contracts
module.exports = async (deployer, network, accounts) => {
    const SUMERO_OWNER = accounts[0];
    let FACTORY_ADDRESS = '';
    let WETH_ADDRESS = '';
    let USDC_ADDRESS = '';
    let TOKEN_A_ADDRESS = '';
    let CLAY_TOKEN_ADDRESS = '';
    let USDC_CLAY_PAIR = '';
    let WETH_TOKEN_A_PAIR = '';
    let WETH_CLAY_TOKEN_PAIR = '';

    // local ganache instance
    if (isDevNetwork('development')) {

        // mock ERC20 Token
        // new() used to deploy multiple instances of a contract
        // contracts deployed via new() are not tracked in truffle migrations contract
        const tokenA = await MockERC20.new('Token A', 'TKA', web3.utils.toWei('100000', 'ether'));
        TOKEN_A_ADDRESS = tokenA.address;
        console.log("TOKEN A ADDRESS: " + TOKEN_A_ADDRESS);
        assert.equal(web3.utils.fromWei(await tokenA.balanceOf(SUMERO_OWNER)), '100000', "Token A Balance doesn't match");

        // WETH 
        // only for local development enviornment
        await deployer.deploy(WETH);
        const weth = await WETH.deployed();
        WETH_ADDRESS = weth.address;
        console.log("WETH ADDRESS: " + WETH_ADDRESS)
        // deposit / mint some WETH
        await weth.deposit({ from: SUMERO_OWNER, value: web3.utils.toWei('2000', 'ether') });
        const wethBalance = (await weth.balanceOf(SUMERO_OWNER));
        assert.equal(web3.utils.fromWei(wethBalance), '2000', "WETH Balance doesn't match");

        // USDC 
        // only for local development enviornment
        await deployer.deploy(USDC);
        const usdc = await USDC.deployed();
        USDC_ADDRESS = usdc.address;
        console.log("USDC ADDRESS: " + USDC_ADDRESS)
        // deposit / mint some USDC
        await usdc.deposit({ from: SUMERO_OWNER, value: web3.utils.toWei('2000', 'ether') });
        const usdcBalance = (await usdc.balanceOf(SUMERO_OWNER));
        assert.equal(web3.utils.fromWei(usdcBalance), '2000', "USDC Balance doesn't match");

        // Uniswap Factory 
        await deployer.deploy(Factory, SUMERO_OWNER);
        const factory = await Factory.deployed();
        FACTORY_ADDRESS = factory.address;
        console.log("FACTORY ADDRESS: " + FACTORY_ADDRESS)
        // Uniswap Router
        const router = await deployer.deploy(Router, FACTORY_ADDRESS, WETH_ADDRESS);
        assert.equal(await router.factory(), FACTORY_ADDRESS, "Factory Address doesn't match in router");
        assert.equal(await router.WETH(), WETH_ADDRESS, "WETH Address doesn't match in router");

        const INIT_CODE_HASH = await factory.pairCodeHash();
        console.log("INIT_CODE_HASH", INIT_CODE_HASH);

        // Sushi Swap uses TOKEN <=> WETH PAIR, so the library function uses WETH to calculate the pair address
        //  Here we are using USDC???? so how will it work??

        // Create Swap Pairs via Uniswap Router
        const clayToken = await ClayToken.deployed();
        CLAY_TOKEN_ADDRESS = clayToken.address

        // USDC <=> CLAY PAIR
        const usdcClayPairTX = await factory.createPair(USDC_ADDRESS, CLAY_TOKEN_ADDRESS);
        USDC_CLAY_PAIR = await router.getPair(USDC_ADDRESS, CLAY_TOKEN_ADDRESS);
        assert.notEqual(USDC_CLAY_PAIR, 0x0000000000000000000000000000000000000000, "USDC_CLAY_PAIR not found");
        console.log("USDC_CLAY_PAIR: " + USDC_CLAY_PAIR);
        assert.equal(await factory.getPair(CLAY_TOKEN_ADDRESS, USDC_ADDRESS), USDC_CLAY_PAIR, "USDC_CLAY_PAIR not matching with what's there in factory");

        // Add Liquidity to USDC <=> CLAY PAIR
        const blockNumber = await web3.eth.getBlockNumber();
        const block = await web3.eth.getBlock(blockNumber);
        const timestamp = block.timestamp + 300;

        await usdc.approve(router.address, web3.utils.toWei('2000', 'ether'));
        assert.equal(await usdc.allowance(SUMERO_OWNER, router.address), web3.utils.toWei('2000', 'ether'), "Router doesn't have permission to spend owner's USDC");

        await clayToken.approve(router.address, web3.utils.toWei('2000', 'ether'));
        assert.equal(await clayToken.allowance(SUMERO_OWNER, router.address), web3.utils.toWei('2000', 'ether'), "Router doesn't have permission to spend owner's CLAY");

        // Provide Liquidity
        // 1 USDC => 100 CLAY

        const one_usdc = 1 * (10 ** 18);
        console.log(one_usdc);
        const one_clay = 1 * (10 ** 18);
        console.log(one_clay);

        await router.addLiquidity(
            USDC_ADDRESS,
            CLAY_TOKEN_ADDRESS,
            one_usdc.toString(),
            (10 * one_clay).toString(),
            0,
            0,
            SUMERO_OWNER,
            timestamp,
            { gas: 4000000 }
        )


        // WETH CLAY PAIR

        // const clayToken = await ClayToken.deployed();
        // CLAY_TOKEN_ADDRESS = clayToken.address

        // const wethClayPairTX = await factory.createPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);
        // WETH_CLAY_PAIR = await router.getPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);
        // assert.notEqual(WETH_CLAY_PAIR, 0x0000000000000000000000000000000000000000, "WETH_CLAY_PAIR not found");
        // console.log("WETH_CLAY_PAIR: " + WETH_CLAY_PAIR);
        // // doesn't match if init hash code is not changed in uniswap v2 library
        // assert.equal(await factory.getPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS), WETH_CLAY_PAIR, "WETH_CLAY_PAIR not matching with what's there in factory");

        // // Add Liquidity to WETH <=> CLAY PAIR
        // const blockNumber = await web3.eth.getBlockNumber();
        // const block = await web3.eth.getBlock(blockNumber);
        // const timestamp = block.timestamp + 300;
        // console.log(blockNumber);
        // console.log(block);
        // console.log(block.timestamp);
        // console.log(timestamp);

        // await weth.approve(router.address, web3.utils.toWei('2000', 'ether'));
        // assert.equal(web3.utils.fromWei(await weth.allowance(SUMERO_OWNER, router.address)), '2000', "Router doesn't have permission to spend owner's WETH");

        // await clayToken.approve(router.address, web3.utils.toWei('2000', 'ether'));
        // assert.equal(web3.utils.fromWei(await clayToken.allowance(SUMERO_OWNER, router.address)), '2000', "Router doesn't have permission to spend owner's CLAY");

        // // Once liquidity has been added, ERC20 tokens are transferred to the pair contract, and a LP (Liquidity Provider) token is minted to the address providing liquidity.
        // await router.addLiquidity(
        //     WETH_ADDRESS,
        //     CLAY_TOKEN_ADDRESS,
        //     web3.utils.toWei('0.01', 'ether'),
        //     web3.utils.toWei('1000', 'ether'),
        //     web3.utils.toWei('0.001', 'ether'),
        //     web3.utils.toWei('0.005', 'ether'),
        //     SUMERO_OWNER,
        //     timestamp,
        //     { gas: 4000000 }
        // )

        // const pairContract = await Pair.at(WETH_CLAY_PAIR);
        // const lpTokens = web3.utils.fromWei(await pairContract.balanceOf(SUMERO_OWNER));
        // console.log(lpTokens);
        // assert.notEqual(lpTokens, 0, "SUMERO owner doesn't have LP tokens");

        // // WETH <=> CLAY TOKEN PAIR
        // const wethClayTokenPairTX = await factory.createPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);
        // WETH_CLAY_TOKEN_PAIR = await router.getPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);

        // if (isZeroAddress(WETH_CLAY_TOKEN_PAIR)) {
        //     console.log("WETH_CLAY_TOKEN_PAIR Contract NOT FOUND");
        // } else {
        //     console.log("WETH_CLAY_TOKEN_PAIR: " + WETH_CLAY_TOKEN_PAIR)
        // }
    }


    //kovan testnet

    // mainnet
}