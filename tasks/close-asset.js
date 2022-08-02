// npx hardhat close-asset --type <asset-type> --address <asset-address> --network <network-name>
// Asset Status
// 0 - Closed,
// 1 - Paused,
// 2 - Open 
task("close-asset", "Closes assets on asset manager")
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
                console.log("Closing emp...")
                expect((await assetManager.idToVerifiedEmps(args.id)).status).eq(2)
                tx = await assetManager.closeEmp(args.id)
                tx.wait()
                expect((await assetManager.idToVerifiedEmps(args.id)).status).eq(0)
                console.log("Emp successfully closed!") 
                console.log("\nTransaction Receipt: \n", tx)
            }
            else if(args.type == "swap-pair"){
                console.log("Closing swap pair...")
                expect((await assetManager.idToVerifiedSwapPairs(args.id)).status).eq(2)
                tx = await assetManager.closeSwapPair(args.id)
                tx.wait()
                expect((await assetManager.idToVerifiedSwapPairs(args.id)).status).eq(0)
                console.log("Swap pair successfully closed!") 
                console.log("\nTransaction Receipt: \n", tx)
            }
            else if(args.type == "staking-reward"){
                console.log("Closing staking reward...")
                expect((await assetManager.idToVerifiedStakingRewards(args.id)).status).eq(2)
                tx = await assetManager.closeStakingReward(args.id)
                tx.wait()
                expect((await assetManager.idToVerifiedStakingRewards(args.id)).status).eq(0)
                console.log("Staking rewards successfully closed!") 
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
