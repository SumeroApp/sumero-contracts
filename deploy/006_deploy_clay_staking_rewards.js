/**
 * This script deploys the CLAY Staking Rewards token contract
 * 
 */
const { expect } = require("chai");
const colors = require('colors');
const { ethers } = require("hardhat")

module.exports = async ({
    getNamedAccounts,
    deployments,
}) => {

    console.log(colors.bold("\n==> Running 006_deploy_clay_staking_rewards script"));

    const { deployer } = await getNamedAccounts();
    console.log(colors.green("\nDEPLOYER ADDRESS is:", deployer));

    const clayToken = await ethers.getContract("ClayToken", deployer);
    const SumeroLpToken = await hre.ethers.getContractFactory("UniswapV2ERC20");
    // How do you get LP token address?
    // this is hardcoded, ideally should automate fetching this address
    // USDC-CLAY LP Token => 0x4087e9d765200daB6D02E4fFa4Adc88d3BC29f2F
    const sumeroLpToken = await SumeroLpToken.attach("0x4087e9d765200daB6D02E4fFa4Adc88d3BC29f2F");

    const ClayStakingRewardsDeployed = await deployments.deploy('ClayStakingRewards', {
        from: deployer,
        gasLimit: 4000000,
        args: [sumeroLpToken.address, clayToken.address]
    });
    console.log(colors.green("\nCLAY STAKING REWARDS ADDRESS:", ClayStakingRewardsDeployed.address));
    const clayStakingRewards = await ethers.getContract("ClayStakingRewards", deployer);

    expect(await clayStakingRewards.clayToken()).to.equal(clayToken.address, 'Clay Token address doesnt match');
    expect(await clayStakingRewards.stakingToken()).to.equal(sumeroLpToken.address, 'Sumero LP Token address doesnt match');
};

module.exports.tags = ['ClayStakingRewards'];