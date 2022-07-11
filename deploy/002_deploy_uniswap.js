/**
 * This script deploys the factory and router contracts for Uniswap. Creates USDC-CLAY Pair.
 * 
 * @dev
 * Deploys USDC and WETH on test net. Adds Liquidity to USDC-CLAY Pair.
 */
const { expect } = require("chai");
const colors = require('colors');
const { ethers } = require("hardhat");

// this function is injected with HRE
module.exports = async ({
    getNamedAccounts,
    deployments,
}) => {
    console.log(colors.bold("\n==> Running 002_deploy_uniswap script"));

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    let UniswapFactoryDeployed;
    let factory;
    let UniswapRouterDeployed;
    let router;

    const clayToken = await ethers.getContract("ClayToken", deployer);

    const WETHDeployed = {
        address: '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
    };


    const USDCDeployed = {
        address: '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede'
    };

    // Uniswap Factory 
    try {
        UniswapFactoryDeployed = await deploy('UniswapV2Factory', {
            from: deployer,
            gasLimit: 4000000,
            args: [deployer],
            skipIfAlreadyDeployed: true
        });
        console.log(colors.green("\nFACTORY ADDRESS: " + UniswapFactoryDeployed.address));
        factory = await ethers.getContract("UniswapV2Factory", deployer);

        // Uniswap Router
        UniswapRouterDeployed = await deploy('UniswapV2Router02', {
            from: deployer,
            gasLimit: 4000000,
            args: [UniswapFactoryDeployed.address, WETHDeployed.address],
            skipIfAlreadyDeployed: true
        });
        console.log(colors.green("\nROUTER ADDRESS: " + UniswapRouterDeployed.address));
        router = await ethers.getContract("UniswapV2Router02", deployer);

        expect(await router.factory()).to.equal(UniswapFactoryDeployed.address, "Factory Address doesn't match in router");
        expect(await router.WETH()).to.equal(WETHDeployed.address, "WETH Address doesn't match in router");
        const INIT_CODE_HASH = await factory.pairCodeHash();
        console.log(colors.blue("\nINIT_CODE_HASH", INIT_CODE_HASH));

    } catch (error) {
        console.log(colors.red("Issue with Uniswap Factory / Router Deployment"));
        console.log(colors.red(error));
    }

    // Create USDC-CLAY Pair
    try {
        const pairAddress = await factory.getPair(clayToken.address, USDCDeployed.address);
        console.log(colors.blue("\npairAddress from factory", pairAddress));

        // USDC <=> CLAY PAIR
        if (pairAddress == 0x0000000000000000000000000000000000000000) {
            const usdcClayPairTX = await factory.createPair(USDCDeployed.address, clayToken.address);
            const USDC_CLAY_PAIR = await router.getPair(USDCDeployed.address, clayToken.address);

            console.log(colors.green("\nUSDC_CLAY_PAIR created", USDC_CLAY_PAIR));
            expect(await factory.getPair(clayToken.address, USDCDeployed.address)).to.equal(USDC_CLAY_PAIR, "USDC_CLAY_PAIR not matching with what's there in factory");
        }
    } catch (error) {
        console.log(colors.red("Issue when adding USDC-CLAY Pair to Uniswap Pool"));
        console.log(colors.red(error));
    }
};

module.exports.tags = ['Uniswap'];
