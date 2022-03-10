// hardhat
//  used to run script standalone i.e. node script.js
// const hre = require("hardhat");
// await hre.run('compile');
// const ethers = hre.ethers;
const { expect } = require("chai");

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let WETHDeployed;
    let weth;
    let USDCDeployed;
    let usdc;
    let UniswapFactoryDeployed;
    let factory;
    let UniswapRouterDeployed;
    let router;

    const clayToken = await ethers.getContract("ClayToken", deployer);

    {
        // WETH 
        // only for local development enviornment
        WETHDeployed = await deploy('WETH', {
            from: deployer,
            gasLimit: 4000000,
            args: [],
        });
        console.log("\nWETH ADDRESS: " + WETHDeployed.address);
        weth = await ethers.getContract("WETH", deployer);

        {
            // deposit / mint some WETH
            await weth.deposit({ from: deployer, value: web3.utils.toWei('2000', 'ether') });
            const wethBalance = (await weth.balanceOf(deployer)).toString();
            expect(web3.utils.fromWei(wethBalance)).to.equal('2000', "WETH Balance doesn't match");
        }
    }


    {
        // USDC 
        // only for local development enviornment
        USDCDeployed = await deploy('USDC', {
            from: deployer,
            gasLimit: 4000000,
            args: [],
        });
        console.log("\nUSDC ADDRESS: " + USDCDeployed.address)
        usdc = await ethers.getContract("USDC", deployer);

        {
            // deposit / mint some USDC
            await usdc.deposit({ from: deployer, value: web3.utils.toWei('2000', 'ether') });
            const usdcBalance = (await usdc.balanceOf(deployer)).toString();
            expect(web3.utils.fromWei(usdcBalance)).to.equal('2000', "USDC Balance doesn't match");
        }
    }

    {
        // Uniswap Factory 
        UniswapFactoryDeployed = await deploy('UniswapV2Factory', {
            from: deployer,
            gasLimit: 4000000,
            args: [deployer],
        });
        console.log("\nFACTORY ADDRESS: " + UniswapFactoryDeployed.address)
        factory = await ethers.getContract("UniswapV2Factory", deployer);

        // Uniswap Router
        UniswapRouterDeployed = await deploy('UniswapV2Router02', {
            from: deployer,
            gasLimit: 4000000,
            args: [UniswapFactoryDeployed.address, WETHDeployed.address],
        });
        console.log("\nROUTER ADDRESS: " + UniswapRouterDeployed.address)
        router = await ethers.getContract("UniswapV2Router02", deployer);

        {
            expect(await router.factory()).to.equal(UniswapFactoryDeployed.address, "Factory Address doesn't match in router");
            expect(await router.WETH()).to.equal(WETHDeployed.address, "WETH Address doesn't match in router");
            const INIT_CODE_HASH = await factory.pairCodeHash();
            console.log("INIT_CODE_HASH", INIT_CODE_HASH);
        }
    }

    {
        // USDC <=> CLAY PAIR
        const usdcClayPairTX = await factory.createPair(USDCDeployed.address, clayToken.address);
        const USDC_CLAY_PAIR = await router.getPair(USDCDeployed.address, clayToken.address);

        {
            expect(USDC_CLAY_PAIR).not.to.equal(0x0000000000000000000000000000000000000000, "USDC_CLAY_PAIR not found");
            console.log("\nUSDC_CLAY_PAIR: " + USDC_CLAY_PAIR);
            expect(await factory.getPair(clayToken.address, USDCDeployed.address)).to.equal(USDC_CLAY_PAIR, "USDC_CLAY_PAIR not matching with what's there in factory");
        }

        // Add Liquidity to USDC <=> CLAY PAIR
        const blockNumber = await web3.eth.getBlockNumber();
        const block = await web3.eth.getBlock(blockNumber);
        const timestamp = block.timestamp + 300;

        await usdc.approve(router.address, web3.utils.toWei('2000', 'ether'));
        expect(await usdc.allowance(deployer, router.address)).to.equal(web3.utils.toWei('2000', 'ether'), "Router doesn't have permission to spend owner's USDC");

        await clayToken.approve(router.address, web3.utils.toWei('2000', 'ether'));
        expect(await clayToken.allowance(deployer, router.address)).to.equal(web3.utils.toWei('2000', 'ether'), "Router doesn't have permission to spend owner's CLAY");

        // Provide Liquidity
        // 1 USDC => 100 CLAY

        const one_usdc = 1 * (10 ** 18);
        console.log(one_usdc);
        const one_clay = 1 * (10 ** 18);
        console.log(one_clay);

        await router.addLiquidity(
            USDCDeployed.address,
            clayToken.address,
            one_usdc.toString(),
            (10 * one_clay).toString(),
            0,
            0,
            deployer,
            timestamp
        )
    }
};