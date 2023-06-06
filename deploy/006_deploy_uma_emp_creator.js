const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    const { live } = network;

    // Deploy our own Finder
    // const Finder = await deployments.get("Finder");

    // Using Finder deployed by UMA on mainnet
    const Finder = { address: "0x40f941E48A552bF496B154Af6bf55725f18D77c3" };

    const TokenFactory = await deployments.get("TokenFactory");

    // skipIfAlreadyDeployed is true, make it false if you want to force a re-deployment of EMPLib
    const EMPLib = await deploy("ExpiringMultiPartyLib", { from: deployer, log: true, skipIfAlreadyDeployed: true });

    await deploy("ExpiringMultiPartyCreator", {
        from: deployer,
        args: [Finder.address, TokenFactory.address],
        libraries: { ExpiringMultiPartyLib: EMPLib.address },
        log: true,
        skipIfAlreadyDeployed: true,
    });
};
module.exports = func;
func.tags = ["ExpiringMultiPartyCreator"];
// When deploying our own finder, uncomment below
// func.dependencies = ["Finder", "TokenFactory"];
func.dependencies = ["TokenFactory"];

