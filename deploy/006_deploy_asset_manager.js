/**
 * This script deploys the Asset Manager Contract
 * 
 */
const { expect } = require("chai");
const colors = require('colors');
const { ethers } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {

    console.log(colors.bold("\n==> Running 006_deploy_asset_manager script"));
    const { deployer } = await getNamedAccounts();

    const AssetManagerDeployed = await deployments.deploy('AssetManager', {
        from: deployer,
        gasLimit: 4000000,
        args: [],
        skipIfAlreadyDeployed: true
    });

    const assetManager = await ethers.getContract("AssetManager", deployer);
    console.log(colors.green("\nASSET MANAGER CONTRACT ADDRESS:", AssetManagerDeployed.address));

    const totalEmpAssets = (await assetManager.totalEmpAssets()).toString();
    console.log(colors.green("\n EMPs in Asset Manager: ", totalEmpAssets));

    await iterateAssets(totalEmpAssets, "idToVerifiedEmps", assetManager);

    const totalSwapPairAssets = (await assetManager.totalSwapPairAssets()).toString();
    console.log(colors.green("\n Swap Pairs in Asset Manager: ", totalSwapPairAssets));

    await iterateAssets(totalSwapPairAssets, "idToVerifiedSwapPairs", assetManager);

    const totalStakingRewardAssets = (await assetManager.totalStakingRewardAssets()).toString();
    console.log(colors.green("\n Staking Rewards in Asset Manager: ", totalStakingRewardAssets));

    await iterateAssets(totalStakingRewardAssets, "idToVerifiedStakingRewards", assetManager);


};

const iterateAssets = async (numOfAssets, mappingName, contract) => {
    for (let i = 0; i < numOfAssets; ++i) {
        const asset = await contract[mappingName](i + 1);
        console.log(colors.blue("\n address: " + asset.addr));
        console.log(colors.blue(" status: " + asset.status));
    }
}

module.exports.tags = ['AssetManager'];
