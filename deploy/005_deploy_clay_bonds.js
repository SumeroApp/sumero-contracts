/**
 * This script deploys the CLAY Bonds token contract
 * 
 */
const { expect } = require("chai");
const colors = require('colors');

module.exports = async ({
    getNamedAccounts,
    deployments,
}) => {

    console.log(colors.bold("\n==> Running 005_deploy_clay_token script"));

    const { deployer } = await getNamedAccounts();
    console.log(colors.green("\nDEPLOYER ADDRESS is:", deployer));

    const clayToken = await ethers.getContract("ClayToken", deployer);
    const ClayBondsDeployed = await deployments.deploy('ClayBonds', {
        from: deployer,
        gasLimit: 4000000,
        args: [clayToken.address, web3.utils.toWei('200000', 'ether'), web3.utils.toWei('20000', 'ether')]
    });
    console.log(colors.green("\nCLAY BONDS ADDRESS:", ClayBondsDeployed.address));

    const clayBonds = await ethers.getContract("ClayBonds", deployer);

    expect(await clayBonds.clay()).to.equal(clayToken.address, 'Clay Token address doesnt match');

    console.log(colors.blue("\nApproving allowance of User's CLAY to ClayBonds: ....."));
    await clayToken.approve(ClayBondsDeployed.address, web3.utils.toWei('2000', 'ether'));

    console.log(colors.green("depositStartDate: ", (await clayBonds.depositStartDate()).toString()));
    console.log(colors.green("depositCloseDate: ", (await clayBonds.depositCloseDate()).toString()));
    console.log(colors.green("maturationDate: ", (await clayBonds.maturationDate()).toString()));
    console.log(colors.green("dailyYieldPercent: ", (await clayBonds.dailyYieldPercent()).toString()));
    console.log(colors.green("bonds balance of user: ", (await clayBonds.balanceOf(deployer)).toString()));
    console.log(colors.green("clay balance of ClayBonds Contract: ", (await clayToken.balanceOf(ClayBondsDeployed.address)).toString()));

    console.log(colors.blue("\nIssuing zClayBonds: ....."));
    const issueTx = await clayBonds.issue(web3.utils.toWei('1', 'ether'));
    const issueReceipt = await issueTx.wait();

    console.log(colors.green("bonds balance of user: ", (await clayBonds.balanceOf(deployer)).toString()));
    console.log(colors.green("clay balance of ClayBonds Contract: ", (await clayToken.balanceOf(ClayBondsDeployed.address)).toString()));
};

module.exports.tags = ['ClayBonds'];