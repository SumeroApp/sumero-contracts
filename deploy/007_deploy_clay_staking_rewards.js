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

    let sumeroLpToken = { address: "0x8556Fa1107401dAD95D67B1a9bbF49d87Fa18b4c" };

    // change days depending on when you want staking to end
    // const days = 4;
    // const currentTimestamp = Date.now() / 1000;
    // const expirationTimestamp = Math.floor(currentTimestamp + (days * 24 * 3600));
    const expirationTimestamp = 1685368800;
    const maxReward = ethers.utils.parseEther("16000000").toString()

    // hardcode above address to point to correct LP token address
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
