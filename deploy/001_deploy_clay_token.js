/**
 * This script deploys the native CLAY token contract
 * 
 * @dev
 * Mints Clay tokens for testing
 */
const { expect } = require("chai");
const { isLocalNetwork, isForkedNetwork } = require('../utils/helper');
const colors = require('colors');

// this function is injected with HRE
module.exports = async ({
    getNamedAccounts,
    deployments,
    network,
}) => {

    console.log(colors.bold("\n==> Running 001_deploy_clay_token script"));

    console.log(colors.blue("\nNetwork Status isLocalNetwork: ", isLocalNetwork(), " isForkedNetwork: ", isForkedNetwork()));

    const { deploy } = deployments;
    const { deployer, sumeroTestUser } = await getNamedAccounts();
    console.log(colors.green("\nDEPLOYER ADDRESS is:", deployer));

    const ClayTokenDeployed = await deploy('ClayToken', {
        from: deployer,
        gasLimit: 4000000,
        args: [],
        skipIfAlreadyDeployed: true
    });
    console.log(colors.green("CLAY TOKEN ADDRESS:", ClayTokenDeployed.address));

    const clayToken = await ethers.getContract("ClayToken", deployer);

    if (isLocalNetwork() && !isForkedNetwork()) {
        console.log(colors.blue("\nMinting Clay Token.."));
        // test
        // mint CLAY token to accounts[0]
        await clayToken.mint(deployer, web3.utils.toWei('800000', 'ether'));
        const clayTokenBalance = (await clayToken.balanceOf(deployer)).toString();

        expect(web3.utils.fromWei(clayTokenBalance)).to.equal('800000', "Clay Token Balance doesn't match");

        // mint CLAY token to metamask wallet address
        await clayToken.mint(sumeroTestUser, web3.utils.toWei('800000', 'ether'));
        const metamaskAddressBalance = (await clayToken.balanceOf(sumeroTestUser)).toString();

        expect(web3.utils.fromWei(metamaskAddressBalance)).to.equal('800000', "Clay Token Balance doesn't match");
    }

};

module.exports.tags = ['ClayToken'];