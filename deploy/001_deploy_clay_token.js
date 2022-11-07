/**
 * This script deploys the native CLAY token contract
 * 
 */
const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    await deploy("ClayToken", { from: deployer, log: true, skipIfAlreadyDeployed: false });
};
module.exports = func;
func.tags = ["ClayToken"];
