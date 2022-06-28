/**
 * This script deploys the factory and router contracts for Uniswap. Creates USDC-CLAY Pair.
 * 
 * @dev
 * Deploys USDC and WETH on test net. Adds Liquidity to USDC-CLAY Pair.
 */
const { expect } = require("chai");
const { isLocalNetwork, isForkedNetwork, matchesForkedNetwork } = require('../utils/helper');
const colors = require('colors');
const { ethers } = require("hardhat");

// this function is injected with HRE
module.exports = async ({
    getNamedAccounts,
    deployments,
    network
}) => {
    console.log(colors.bold("\n==> Running 002_deploy_uniswap script"));

    const { deploy } = deployments;
    const { deployer, sumeroTestUser } = await getNamedAccounts();

    let WETHDeployed;
    let weth;
    let USDCDeployed;
    let usdc;
    let UniswapFactoryDeployed;
    let factory;
    let UniswapRouterDeployed;
    let router;

    const clayToken = await ethers.getContract("ClayToken", deployer);

    // WETH 
    try {
        // only for local development enviornment
        if (isLocalNetwork() && !isForkedNetwork()) {
            WETHDeployed = await deploy('WETH', {
                from: deployer,
                gasLimit: 4000000,
                args: [],
            });
            console.log(colors.green("\nWETH ADDRESS: " + WETHDeployed.address));
            weth = await ethers.getContract("WETH", deployer);

            // deposit / mint some WETH
            await weth.deposit({
                from: deployer, value: ethers.utils.parseEther('2000')
            });
            const wethBalance = (await weth.balanceOf(deployer)).toString();
            expect(ethers.utils.formatEther(wethBalance)).to.equal('2000.0', "WETH Balance doesn't match");

        } else if (network.name == 'kovan' || matchesForkedNetwork('kovan')) {
            WETHDeployed = {
                address: '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
            };
        } else {
            throw Error('Unable to find WETH contract address')
        }
    } catch (error) {
        console.log(colors.red("Issue with WETH Deployment"));
        console.log(colors.red(error));
    }


    // USDC 
    try {
        if (isLocalNetwork() && !isForkedNetwork()) {
            // only for local development enviornment
            USDCDeployed = await deploy('USDC', {
                from: deployer,
                gasLimit: 4000000,
                args: [],
            });
            console.log(colors.green("\nUSDC ADDRESS: " + USDCDeployed.address));
            usdc = await ethers.getContract("USDC", deployer);

            // deposit / mint some USDC
            await usdc.deposit({ from: deployer, value: ethers.utils.parseUnits('2000', 'mwei') });
            const usdcBalance = (await usdc.balanceOf(deployer)).toString();
            expect(ethers.utils.formatUnits(usdcBalance, 'mwei')).to.equal('2000.0', "USDC Balance doesn't match");

            await usdc.transfer(sumeroTestUser, ethers.utils.parseUnits('1000', 'mwei'))
            const sumeroUsdcBalance = (await usdc.balanceOf(sumeroTestUser)).toString();
            expect(ethers.utils.formatUnits(sumeroUsdcBalance, 'mwei')).to.equal('1000.0', "USDC Balance doesn't match");

        } else if ((network.name == 'kovan' || matchesForkedNetwork('kovan'))) {
            USDCDeployed = {
                address: '0xc2569dd7d0fd715b054fbf16e75b001e5c0c1115'
            };
            const USDC = await ethers.getContractFactory("USDC");
            usdc = await USDC.attach(USDCDeployed.address);
        } else {
            throw Error('Unable to find USDC contract address')
        }

    } catch (error) {
        console.log(colors.red("Issue with USDC Deployment"));
        console.log(colors.red(error));
    }

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

    // Add Liquidty to USDC-CLAY Pair
    try {
        // Make sure address `adding liquidty` has balance of both the tokens. Also, should have approved sufficient amount of tokens to the router contract.
        const currentBlock = await ethers.provider.getBlockNumber()
        const block = await ethers.provider.getBlock(currentBlock);
        const timestamp = block.timestamp + 300;

        if (isLocalNetwork() && !isForkedNetwork()) {
            await usdc.approve(router.address, ethers.utils.parseEther('2000'));
            expect(await usdc.allowance(deployer, router.address)).to.equal(ethers.utils.parseEther('2000'), "Router doesn't have permission to spend owner's USDC");
            console.log(colors.blue("\nUSDC Approved"));

            await clayToken.approve(router.address, ethers.utils.parseEther('2000'));
            expect(await clayToken.allowance(deployer, router.address)).to.equal(ethers.utils.parseEther('2000'), "Router doesn't have permission to spend owner's CLAY");
            console.log(colors.blue("\nCLAY Approved"));


            // Provide Liquidity
            // 1 USDC => 100 CLAY
            const one_usdc = 1 * (10 ** 6);
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
            console.log(colors.blue("\nLiquidity Added to USDC-CLAY Pair"));
        }
        // else provide liquidity manually in a live network


    } catch (error) {
        console.log(colors.red("Issue when adding liquidity to USDC-CLAY Pair"));
        console.log(colors.red(error));
    }
};