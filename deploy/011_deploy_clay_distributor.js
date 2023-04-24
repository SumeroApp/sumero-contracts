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
    const MerkleTreeRoot = "0xa28428b8c6cc47559f1fd90df3c5e1c0e7347c06edc9b12a87be9f7db2d5e54b";
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
