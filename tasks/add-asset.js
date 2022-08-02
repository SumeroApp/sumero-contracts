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
            if (args.type == "emp") {
                console.log("Adding emp...")
                tx = await assetManager.addEmp(args.address)
                const totalEMP = await assetManager.totalEmpAssets()
                expect((await assetManager.idToVerifiedEmps(totalEMP)).addr).eq(ethers.utils.getAddress(args.address))
                const totalSwapPair = await assetManager.totalSwapPairAssets()
                console.log("Emp successfully added!" + totalEMP)
                console.log("\nTransaction Receipt: \n", tx)
            }
            else if (args.type == "swap-pair") {
                console.log("Adding swap pair...")
                tx = await assetManager.addSwapPair(args.address)
                const totalSwapPair = await assetManager.totalSwapPairAssets()
                expect((await assetManager.idToVerifiedSwapPairs(totalSwapPair)).addr).eq(ethers.utils.getAddress(args.address))
                console.log("Swap pair successfully added!")
                console.log("\nTransaction Receipt: \n", tx)
            }
            else if (args.type == "staking-reward") {
                console.log("Adding staking reward...")
                tx = await assetManager.addStakingReward(args.address)
                const totalStakingReward = await assetManager.totalStakingRewardAssets()
                expect((await assetManager.idToVerifiedStakingRewards(totalStakingReward)).addr).eq(ethers.utils.getAddress(args.address))
                console.log("Staking rewards successfully added!")
                console.log("\nTransaction Receipt: \n", tx)
            }
            else {
                return console.error("Asset type error!");
            }

            const txUrl = getTxUrl(deployments.network, tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );
