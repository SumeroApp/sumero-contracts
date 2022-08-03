// npx hardhat add-asset --type <asset-type> --address <asset-address> --network <network-name>
task("add-asset", "Adds assets to Asset Manager")
    .addParam("type", "Asset Type: emp,swap-pair or staking-reward")
    .addParam("address", "The address of the asset")
    .setAction(
        async (args, deployments) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');
            const assetManager = await ethers.getContract("AssetManager", deployer);

            let tx;
            let txUrl;
            if (args.type == "emp") {
                console.log("Adding emp...")
                try {
                    tx = await assetManager.addEmp(args.address)
                    await tx.wait()
                    const totalEMP = await assetManager.totalEmpAssets()
                    expect((await assetManager.idToVerifiedEmps(totalEMP)).addr).eq(ethers.utils.getAddress(args.address))
                    console.log("Emp successfully added!" + totalEMP)
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(deployments.network, tx.hash);
                } catch (error) {
                    console.log(error)
                }
            }
            else if (args.type == "swap-pair") {
                console.log("Adding swap pair...")
                try {
                    tx = await assetManager.addSwapPair(args.address)
                    await tx.wait()
                    const totalSwapPair = await assetManager.totalSwapPairAssets()
                    expect((await assetManager.idToVerifiedSwapPairs(totalSwapPair)).addr).eq(ethers.utils.getAddress(args.address))
                    console.log("Swap pair successfully added!")
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(deployments.network, tx.hash);
                } catch (error) {
                    console.log(error)
                }
            }
            else if (args.type == "staking-reward") {
                console.log("Adding staking reward...")
                try {
                    tx = await assetManager.addStakingReward(args.address)
                    await tx.wait()
                    const totalStakingReward = await assetManager.totalStakingRewardAssets()
                    expect((await assetManager.idToVerifiedStakingRewards(totalStakingReward)).addr).eq(ethers.utils.getAddress(args.address))
                    console.log("Staking rewards successfully added!")
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(deployments.network, tx.hash);
                }
                catch (error) {
                    console.log(error)
                }
            }
            else {
                return console.error("Asset type error!");
            }
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );
