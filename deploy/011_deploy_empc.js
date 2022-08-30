const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const Finder = await deployments.get("Finder");
    const TokenFactory = await deployments.get("TokenFactory");
    const Timer = await deployments.get("Timer");

    console.log("starting to deploy EMPlib");
    const EMPLib = await deploy("ExpiringMultiPartyLib", { from: deployer, log: true, skipIfAlreadyDeployed: true });
    console.log("ending EMPlib");
    console.log(EMPLib);

    // await deploy("ExpiringMultiPartyCreator", {
    //     from: deployer,
    //     args: [Finder.address, TokenFactory.address, Timer.address],
    //     libraries: { ExpiringMultiPartyLib: EMPLib.address },
    //     log: true,
    //     skipIfAlreadyDeployed: true,
    // });
};
module.exports = func;
func.tags = ["ExpiringMultiPartyCreator", "emp"];
func.dependencies = ["Finder", "TokenFactory", "Timer"];
