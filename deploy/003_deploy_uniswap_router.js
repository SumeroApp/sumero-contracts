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

const getWethAddressOrThrow = (network) => {
    if (network.name === 'kovan') {
        return "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
    } else if (network.name === "goerli") {
        return "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    }
    else {
        throw new Error(`Unable to find WETH Address for network ${network.name}`);
    }
}