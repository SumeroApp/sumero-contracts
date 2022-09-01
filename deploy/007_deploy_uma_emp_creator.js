const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    // Deploy our own Finder
    // const Finder = await deployments.get("Finder");

    // Using Finder deployed by UMA on goerli
    const Finder = { address: "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e" };

    const TokenFactory = await deployments.get("TokenFactory");
    const Timer = await deployments.get("Timer");

    const EMPLib = await deploy("ExpiringMultiPartyLib", { from: deployer, log: true, skipIfAlreadyDeployed: true });

    await deploy("ExpiringMultiPartyCreator", {
        from: deployer,
        args: [Finder.address, TokenFactory.address, Timer.address],
        libraries: { ExpiringMultiPartyLib: EMPLib.address },
        log: true,
        skipIfAlreadyDeployed: true,
    });
};
module.exports = func;
func.tags = ["ExpiringMultiPartyCreator"];
// When deploying our own finder, uncomment below
// func.dependencies = ["Finder", "TokenFactory", "Timer"];
func.dependencies = ["TokenFactory", "Timer"];

