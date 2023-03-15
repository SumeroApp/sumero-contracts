/**
 * This script deploys the CLAY Bonds token contract
 * 
 */
const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const ClayToken = await deployments.get("ClayToken");
    const MAX_BOND_REWARDS = ethers.utils.parseEther('50000000');
    console.log("MAX_BOND_REWARDS: ", MAX_BOND_REWARDS.toString());

    await deploy("ClayBonds", {
        from: deployer,
        args: [ClayToken.address, MAX_BOND_REWARDS],
        log: true,
        skipIfAlreadyDeployed: true
    });
};
module.exports = func;
func.tags = ["ClayBonds"];
func.dependencies = ["ClayToken"];
