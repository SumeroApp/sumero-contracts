// npx hardhat list-assets --network <network-name>
task("list-assets", "List assets in Asset Manager")
    .setAction(
        async (args, hre) => {
            const { iterateAssets } = require('../utils/helper');
            const colors = require('colors');
            const { deployer } = await hre.getNamedAccounts();

            const assetManager = await hre.ethers.getContract("AssetManager", deployer);

            console.log(colors.green("\nASSET MANAGER CONTRACT ADDRESS:", assetManager.address));

            const totalEmpAssets = (await assetManager.totalEmpAssets()).toString();
            console.log(colors.green("\n EMPs in Asset Manager: ", totalEmpAssets));

            await iterateAssets(totalEmpAssets, "idToVerifiedEmps", assetManager);

            const totalSwapPairAssets = (await assetManager.totalSwapPairAssets()).toString();
            console.log(colors.green("\n Swap Pairs in Asset Manager: ", totalSwapPairAssets));

            await iterateAssets(totalSwapPairAssets, "idToVerifiedSwapPairs", assetManager);

            const totalStakingRewardAssets = (await assetManager.totalStakingRewardAssets()).toString();
            console.log(colors.green("\n Staking Rewards in Asset Manager: ", totalStakingRewardAssets));

            await iterateAssets(totalStakingRewardAssets, "idToVerifiedStakingRewards", assetManager);
        }
    );