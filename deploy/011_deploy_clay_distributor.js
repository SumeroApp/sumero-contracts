/**
 * This script deploys the Clay Distributor Contract
 * 
 */
const func = async function (hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    const Clay = await deployments.get("ClayToken");
    // run build-merkle task to generate Merkle Tree Root
    const MerkleTreeRoot = "0x33ec19caac80a438ca65f6149174a5ecdc4ed6fbf4a70858405fa0cff9d58fd6";
    const DropAmount = "100";
    const DropAmountInWei = ethers.utils.parseUnits(DropAmount, 18);

    await deploy("ClayDistributor", {
        from: deployer,
        args: [Clay.address, MerkleTreeRoot, DropAmountInWei],
        log: true,
        skipIfAlreadyDeployed: false,
    });
};
module.exports = func;
func.tags = ["ClayDistributor"];
