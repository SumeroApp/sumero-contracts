const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

/**
 * This script deploys the CLAY Staking Rewards token contract
 * 
 */
const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const ClayToken = await deployments.get("ClayToken");

    // change below address to point to correct LP token address
    let sumeroLpToken = { address: "0xd009223796E03F88D6fe6B35404E807179A09238" };

    // change timestamp depending on when you want staking to end
    const expirationTimestamp = 1700661600;
    // change max reward value for contract
    const maxReward = ethers.utils.parseEther("16000000").toString()

    if (!sumeroLpToken.address) throw new Error("Need the LP token address");

    await deploy("ClayStakingRewards", {
        from: deployer,
        args: [sumeroLpToken.address, ClayToken.address, expirationTimestamp, maxReward],
        log: true,
        skipIfAlreadyDeployed: true
    });
};
module.exports = func;
func.tags = ["ClayStakingRewards"];
func.dependencies = ["ClayToken"];
