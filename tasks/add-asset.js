// npx hardhat add-asset --type <asset-type> --address <asset-address> --network <network-name>

// npx hardhat add-asset --type emp --address 0x3950da59428e9319ce113368f4141f877e2e4ac8 --network kovan
task("add-asset", "Adds assets to Asset Manager")
    .addParam("type", "Asset Type: emp,swap-pair or staking-reward")
    .addParam("address", "The address of the asset")
    .setAction(
        async (args, deployments) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');
            const assetManager = await ethers.getContract("AssetManager", deployer);
            const colors = require('colors');

            let tx;
            let txUrl;
            if (args.type == "emp") {
                console.log(colors.blue("\n Adding EMP: ....."));
                try {
                    tx = await assetManager.addEmp(args.address)
                    await tx.wait()
                    const totalEMP = await assetManager.totalEmpAssets()
                    expect((await assetManager.idToVerifiedEmps(totalEMP)).addr).eq(ethers.utils.getAddress(args.address))
                    console.log(colors.blue("Emp successfully added!" + "Total EMP: "+ totalEMP))
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                } catch (error) {
                    console.log(colors.red("\n Adding EMP failed: ....."));
                    console.log(error);
                }
            }
            else if (args.type == "swap-pair") {
                console.log(colors.blue("\n Adding swap pair: ....."));
                try {
                    tx = await assetManager.addSwapPair(args.address)
                    await tx.wait()
                    const totalSwapPair = await assetManager.totalSwapPairAssets()
                    expect((await assetManager.idToVerifiedSwapPairs(totalSwapPair)).addr).eq(ethers.utils.getAddress(args.address))
                    console.log(colors.blue("Swap pair successfully added!" + "Total swap pair: "+ totalSwapPair))
                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                } catch (error) {
                    console.log(colors.red("\n Adding swap pair failed: ....."));
                    console.log(error)
                }
            }
            else if (args.type == "staking-reward") {
                console.log(colors.blue("\n Adding staking reward: ....."));
                try {
                    tx = await assetManager.addStakingReward(args.address)
                    await tx.wait()
                    const totalStakingReward = await assetManager.totalStakingRewardAssets()
                    expect((await assetManager.idToVerifiedStakingRewards(totalStakingReward)).addr).eq(ethers.utils.getAddress(args.address))
                    console.log(colors.blue("Staking rewards successfully added!" + "Total staking reward: "+ totalStakingReward))

                    console.log("\nTransaction Receipt: \n", tx)
                    txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                }
                catch (error) {
                    console.log(colors.red("\n Adding staking reward failed: ....."));
                    console.log(error)
                }
            }
            else {
                return console.error("Asset type error!");
            }

            if (txUrl != null) {
                console.log(colors.yellow("\n",txUrl));
            }
        }
    );