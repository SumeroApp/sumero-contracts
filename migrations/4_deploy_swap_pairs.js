// helpers
const { isDevNetwork } = require("../helpers");

const ClayToken = artifacts.require('ClayToken.sol');

// Deploy Pair contract after updating INIT CODE HASH
module.exports = async (deployer, network, accounts) => {
    // local ganache instance
    if (false) {
        console.log("RUNNING SWAP PAIRS");
        // WETH CLAY PAIR
        const clayToken = await ClayToken.deployed();
        CLAY_TOKEN_ADDRESS = clayToken.address
        
        const wethClayPairTX = await factory.createPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);
        WETH_CLAY_PAIR = await router.getPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS);
        assert.notEqual(WETH_CLAY_PAIR, 0x0000000000000000000000000000000000000000, "WETH_CLAY_PAIR not found");
        console.log("WETH_CLAY_PAIR: " + WETH_CLAY_PAIR);
        assert.equal(await factory.getPair(WETH_ADDRESS, CLAY_TOKEN_ADDRESS), WETH_CLAY_PAIR, "WETH_CLAY_PAIR not matching with what's there in factory");

        // Add Liquidity to WETH <=> CLAY PAIR
        const blockNumber = await web3.eth.getBlockNumber();
        const block = await web3.eth.getBlock(blockNumber);
        const timestamp = block.timestamp + 300;
        console.log(blockNumber);
        console.log(block);
        console.log(block.timestamp);
        console.log(timestamp);

        await weth.approve(router.address, web3.utils.toWei('2000', 'ether'));
        assert.equal(web3.utils.fromWei(await usdc.allowance(SUMERO_OWNER, router.address)), '2000', "Router doesn't have permission to spend owner's WETH");

        await clayToken.approve(router.address, web3.utils.toWei('2000', 'ether'));
        assert.equal(web3.utils.fromWei(await clayToken.allowance(SUMERO_OWNER, router.address)), '2000', "Router doesn't have permission to spend owner's CLAY");

        await router.addLiquidity(
            WETH_ADDRESS,
            CLAY_TOKEN_ADDRESS,
            web3.utils.toWei('0.01', 'ether'),
            web3.utils.toWei('1000', 'ether'),
            web3.utils.toWei('0.001', 'ether'),
            web3.utils.toWei('0.005', 'ether'),
            SUMERO_OWNER,
            timestamp,
            { gas: 4000000 }
        )
    }


    //kovan testnet

    // mainnet
}