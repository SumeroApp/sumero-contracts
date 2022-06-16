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
        args: [clayToken.address, web3.utils.toWei('10', 'ether')]
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
    console.log(colors.green("APY_PERCENT: ", (await clayBonds.APY_PERCENT()).toString()));
    console.log(colors.green("BONUS_APY_PERCENT: ", (await clayBonds.BONUS_APY_PERCENT()).toString()));
    console.log(colors.green("BONDS_ISSUANCE_PERIOD: ", (await clayBonds.BONDS_ISSUANCE_PERIOD()).toString()));
    console.log(colors.green("maximumBondRewards: ", (await clayBonds.maximumBondRewards()).toString()));
    console.log(colors.green("totalBondDeposits: ", (await clayBonds.totalBondDeposits()).toString()));
    console.log(colors.green("hasEnoughClayLiquidity: ", (await clayBonds.hasEnoughClayLiquidity()).toString()));
    const daysLeftToMaturationDate = (await clayBonds.getDaysLeftToMaturationDate()).toString();
    const rewardPercent = (await clayBonds.getRewardPercent(daysLeftToMaturationDate)).toString();
    const reward = (await clayBonds.getReward(web3.utils.toWei('1', 'ether'), rewardPercent)).toString();
    console.log(colors.green("getDaysLeftToMaturationDate: ", daysLeftToMaturationDate));
    console.log(colors.green("getRewardPercent: ", rewardPercent));
    console.log(colors.green("getReward: ", reward));

    console.log(colors.green("bonds balance of user: ", (await clayBonds.balanceOf(deployer)).toString()));
    console.log(colors.green("clay balance of ClayBonds Contract: ", (await clayToken.balanceOf(ClayBondsDeployed.address)).toString()));

    console.log(colors.blue("\nIssuing zClayBonds: ....."));
    console.log(colors.blue("\nBond Issuance reverts incase of insufficient CLAY liquidity: ....."));
    await expect(clayBonds.issue(web3.utils.toWei('1', 'ether'))).to.be.reverted;

    console.log(colors.blue("Provide CLAY liquidity to bonds contract: ....."));
    await clayToken.mint(ClayBondsDeployed.address, web3.utils.toWei('1.8', 'ether'))

    console.log(colors.blue("\nIssuing zClayBonds: ....."));
    const issueTx = await clayBonds.issue(web3.utils.toWei('1', 'ether'));
    const issueReceipt = await issueTx.wait();

    console.log(colors.green("bonds balance of user: ", (await clayBonds.balanceOf(deployer)).toString()));
    console.log(colors.green("clay balance of ClayBonds Contract: ", (await clayToken.balanceOf(ClayBondsDeployed.address)).toString()));
    console.log(colors.green("totalBondDeposits: ", (await clayBonds.totalBondDeposits()).toString()));
    console.log(colors.green("hasEnoughClayLiquidity: ", (await clayBonds.hasEnoughClayLiquidity()).toString()));
};

module.exports.tags = ['ClayBonds'];