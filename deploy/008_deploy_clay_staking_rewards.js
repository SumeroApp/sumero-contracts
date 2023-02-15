const { BigNumber } = require("ethers");
const { getEpochFromDate } = require("../utils/helper");

/**
 * This script deploys the CLAY Staking Rewards token contract
 * 
 */
const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const ClayToken = await deployments.get("ClayToken");

    let sumeroLpToken = { address: "0x0b0127317E2B2A90D0a6C53651e6749C44f8BeFe" };
    const now = new Date()
    const expiry = getEpochFromDate(new Date(now.setMonth(now.getMonth() + 2)))
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
