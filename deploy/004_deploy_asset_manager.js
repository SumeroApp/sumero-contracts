/**
 * This script deploys the Asset Manager Contract
 * 
 * @dev
 * Add approved synths to the Asset Manager Contract. These synths are deployed and approved by Sumero.
 */
const { expect } = require("chai");
const colors = require('colors');
const { ethers } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {

    console.log(colors.bold("\n==> Running 004_deploy_asset_manager script"));
    const { deployer } = await getNamedAccounts();

    const AssetManagerDeployed = await deployments.deploy('AssetManager', {
        from: deployer,
        gasLimit: 4000000,
        args: [],
        skipIfAlreadyDeployed: true
    });
    const assetManager = await ethers.getContract("AssetManager", deployer);
    console.log(colors.green("\nASSET MANAGER CONTRACT ADDRESS:", AssetManagerDeployed.address));

    // Approved EMPs are stored in the .env file
    const approvedEmps = JSON.parse(process.env.APPROVED_EMPs);
    for (const empAddress of approvedEmps) {
        console.log(colors.blue("Adding EMP " + empAddress + " to Asset Manager"));
        await assetManager.add(empAddress);
        expect(await assetManager.assetStatus(empAddress)).to.equal(2, 'Asset not in status 2 i.e. Open');
    }

};

module.exports.tags = ['AssetManager'];
