
const { getWethAddressOrThrow } = require('../utils/helper');

const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const UniswapV2Factory = await deployments.get("UniswapV2Factory");
    const wethAddress = getWethAddressOrThrow(hre.network);

    await deploy("UniswapV2Router02", {
        from: deployer,
        args: [UniswapV2Factory.address, wethAddress],
        log: true,
        skipIfAlreadyDeployed: true
    });
};
module.exports = func;
func.tags = ["UniswapV2Router02"];
func.dependencies = ["UniswapV2Factory"];

