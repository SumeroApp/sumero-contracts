// npx hardhat add-asset --type <asset-type> --address <asset-address> --network <network-name>

// npx hardhat add-asset --type emp --address 0x3950da59428e9319ce113368f4141f877e2e4ac8 --network kovan
const { expect } = require('chai');

task("add-asset", "Adds assets to Asset Manager")
    .addParam("type", "Asset Type: emp,swap-pair or staking-reward")
    .addParam("address", "The address of the asset")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if transactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');
            let assetManager = await ethers.getContract("AssetManager", deployer);
            const getGnosisSigner = require('../gnosis/signer');
            if (args.gnosisSafe) {
                assetManager = assetManager.connect(await getGnosisSigner(args.gnosisSafe))
            }
            const colors = require('colors');

            let txUrl;
            let tx;

            switch (args.type) {
                case 'emp': tx = await addEMP(args, assetManager)
                    break;
                case 'swap-pair': tx = await addSwapPair(args, assetManager)
                    break;
                case 'staking-reward': tx = await addStakingReward(args, assetManager)
                    break;
                default: return console.error("Asset type error!");
            }

            txUrl = getTxUrl(hre.deployments.getNetworkName(), tx?.hash);

            if (txUrl != null) {
                console.log(colors.yellow("\n", txUrl));
            }
        }
    );


const addEMP = async (args, assetManager) => {
    const colors = require('colors');
    console.log(colors.blue("\n Adding EMP: ....."));
    try {
        const tx = await assetManager.addEmp(args.address)
        await tx.wait()
        const totalEMP = await assetManager.totalEmpAssets()
        expect((await assetManager.idToVerifiedEmps(totalEMP)).addr).eq(ethers.utils.getAddress(args.address))
        console.log(colors.blue("Emp successfully added!" + "Total EMP: " + totalEMP))
        console.log("\nTransaction Receipt: \n", tx)
        return tx;
    } catch (error) {
        console.log(colors.red("\n Adding EMP failed: ....."));
        console.log(error);
    }
}


const addSwapPair = async (args, assetManager) => {
    const colors = require('colors');
    console.log(colors.blue("\n Adding swap pair: ....."));
    try {
        const tx = await assetManager.addSwapPair(args.address)
        await tx.wait()
        const totalSwapPair = await assetManager.totalSwapPairAssets()
        expect((await assetManager.idToVerifiedSwapPairs(totalSwapPair)).addr).eq(ethers.utils.getAddress(args.address))
        console.log(colors.blue("Swap pair successfully added!" + "Total swap pair: " + totalSwapPair))
        console.log("\nTransaction Receipt: \n", tx)
        return tx;
    } catch (error) {
        console.log(colors.red("\n Adding swap pair failed: ....."));
        console.log(error)
    }
}

const addStakingReward = async (args, assetManager) => {
    const colors = require('colors');
    console.log(colors.blue("\n Adding staking reward: ....."));
    try {

        const tx = await assetManager.addStakingReward(args.address)
        await tx.wait()
        const totalStakingReward = await assetManager.totalStakingRewardAssets()
        expect((await assetManager.idToVerifiedStakingRewards(totalStakingReward)).addr).eq(ethers.utils.getAddress(args.address))
        console.log(colors.blue("Staking rewards successfully added!" + "Total staking reward: " + totalStakingReward))

        console.log("\nTransaction Receipt: \n", tx)
        return tx;
    }
    catch (error) {
        console.log(colors.red("\n Adding staking reward failed: ....."));
        console.log(error)
    }
}