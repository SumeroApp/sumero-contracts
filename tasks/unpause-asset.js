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
            if (args.type == "emp") {
                console.log("Unpausing emp...")
                expect((await assetManager.idToVerifiedEmps(args.id)).status).eq(1)
                tx = await assetManager.unpauseEmp(args.id)
                tx.wait()
                expect((await assetManager.idToVerifiedEmps(args.id)).status).eq(2)
                console.log("Emp successfully paused!") 
                console.log("\nTransaction Receipt: \n", tx)
            }
            else if(args.type == "swap-pair"){
                console.log("Unpausing swap pair...")
                expect((await assetManager.idToVerifiedSwapPairs(args.id)).status).eq(1)
                tx = await assetManager.unpauseSwapPair(args.id)
                tx.wait()
                expect((await assetManager.idToVerifiedSwapPairs(args.id)).status).eq(2)
                console.log("Swap pair successfully paused!") 
                console.log("\nTransaction Receipt: \n", tx)
            }
            else if(args.type == "staking-reward"){
                console.log("Unpausing staking reward...")
                expect((await assetManager.idToVerifiedStakingRewards(args.id)).status).eq(1)
                tx = await assetManager.unpauseStakingReward(args.id)
                expect((await assetManager.idToVerifiedStakingRewards(args.id)).status).eq(2)
                console.log("Staking rewards successfully paused!") 
                console.log("\nTransaction Receipt: \n", tx)
            }
            else{
                return console.error("Asset type error!");
            }

            const txUrl = getTxUrl(deployments.network, tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );
