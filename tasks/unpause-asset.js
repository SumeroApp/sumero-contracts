// npx hardhat unpause-asset --type <asset-type> --address <asset-address> --network <network-name>
// Asset Status
// 0 - Closed,
// 1 - Paused,
// 2 - Open 
task("unpause-asset", "Unpauses assets on asset manager")
    .addParam("type", "Asset Type: emp,swap-pair or staking-reward")
    .addParam("id", "Asset id")
    .setAction(
        async (args, deployments) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');
            const assetManager = await ethers.getContract("AssetManager", deployer);

            let tx;
            let txUrl;

            if (args.type == "emp") {
                console.log("Unpausing emp...")
                try {
                    expect((await assetManager.idToVerifiedEmps(args.id)).status).eq(1)
                    tx = await assetManager.unpauseEmp(args.id)
                    await tx.wait()
                    expect((await assetManager.idToVerifiedEmps(args.id)).status).eq(2)
                    console.log("Emp successfully paused!")
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                } catch (error) {
                    console.log(error)
                }
            }
            else if (args.type == "swap-pair") {
                console.log("Unpausing swap pair...")
                try {
                    expect((await assetManager.idToVerifiedSwapPairs(args.id)).status).eq(1)
                    tx = await assetManager.unpauseSwapPair(args.id)
                    await tx.wait()
                    expect((await assetManager.idToVerifiedSwapPairs(args.id)).status).eq(2)
                    console.log("Swap pair successfully paused!")
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                } catch (error) {
                    console.log(error)
                }
            }
            else if (args.type == "staking-reward") {
                console.log("Unpausing staking reward...")
                try {
                    expect((await assetManager.idToVerifiedStakingRewards(args.id)).status).eq(1)
                    tx = await assetManager.unpauseStakingReward(args.id)
                    await tx.wait()
                    expect((await assetManager.idToVerifiedStakingRewards(args.id)).status).eq(2)
                    console.log("Staking rewards successfully paused!")
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                } catch (error) {
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
