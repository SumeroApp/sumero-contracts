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
    const MerkleTreeRoot = "0x919d7fd06f2331148ded06a841e821626e65b7d3863bca4e8c25877e12540650";

    const DropAmount = "100";
    const DropAmountInWei = ethers.utils.parseUnits(DropAmount, 18);

    const owner = deployer;

    const currentTimestamp = Date.now() / 1000;
    const DAY = 24 * 60 * 60
    const expirationTimestamp = Math.floor(currentTimestamp + DAY);

    await deploy("ClayDistributor", {
        from: deployer,
        args: [Clay.address, MerkleTreeRoot, DropAmountInWei, expirationTimestamp, owner],
        log: true,
        skipIfAlreadyDeployed: false,
    });
};
module.exports = func;
func.tags = ["ClayDistributor"];
