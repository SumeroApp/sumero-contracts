const func = async function (hre) {
    const { deployments, getNamedAccounts, network } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();
    const { live } = network;

    if (live === undefined) throw new Error("Network has no live parameter");

    // If live === true, don't deploy a timer.
    if (live === false) {
        await deploy("Timer", { from: deployer, log: true, skipIfAlreadyDeployed: true });
    } else {
        console.log("live network detected: ignoring deployment of Timer.sol");
    }
};
module.exports = func;
func.tags = ["Timer"];
