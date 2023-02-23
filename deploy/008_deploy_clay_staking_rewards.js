const { BigNumber } = require("ethers");

/**
 * This script deploys the CLAY Staking Rewards token contract
 * 
 */
const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const ClayToken = await deployments.get("ClayToken");

    let sumeroLpToken = { address: "0x3F42bFb8b5378Ea2E1F23A0Ce506E425250dd7d3" };
    const MIN = 60
    const HOUR = 60 * MIN
    const DAY = 24 * HOUR
    const expiry = Math.round((Date.now()/1000 ) + DAY * 30)
    const maxReward = BigNumber.from(10).pow(28);
    // hardcode above address to point to correct LP token address
    if (!sumeroLpToken.address) throw new Error("Need the LP token address");

    await deploy("ClayStakingRewards", {
        from: deployer,
        args: [sumeroLpToken.address, ClayToken.address, expiry, maxReward],
        log: true,
        skipIfAlreadyDeployed: true
    });
};
module.exports = func;
func.tags = ["ClayStakingRewards"];
func.dependencies = ["ClayToken"];
