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
    const MerkleTreeRoot = "0x0b934cc75f95f19a19c4d48db5219d88711e1514a5fdd95a0158419dd14b459d";
    const DropAmount = "5000";
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
