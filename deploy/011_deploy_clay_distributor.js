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
    const MerkleTreeRoot = "0xba7902b1a93487fadac9fb6ac6c356ba50f0e2c802e69c04c9f88455c6ed7f83";
    const DropAmount = "1000";
    const DropAmountInWei = ethers.utils.parseUnits(DropAmount, 18);

    await deploy("ClayDistributor", {
        from: deployer,
        args: [Clay.address, MerkleTreeRoot, DropAmountInWei],
        log: true,
        skipIfAlreadyDeployed: true,
    });
};
module.exports = func;
func.tags = ["ClayDistributor"];
