/**
 * This script deploys the native CLAY token contract
 * 
 * @dev
 * Mints Clay tokens for testing
 */
const { isLocalNetwork, isForkedNetwork } = require('../utils/helper');
const colors = require('colors');

// this function is injected with HRE
module.exports = async ({
    getNamedAccounts,
    deployments,
}) => {

    console.log(colors.bold("\n==> Running 001_deploy_clay_token script"));

    console.log(colors.blue("\nNetwork Status isLocalNetwork: ", isLocalNetwork(), " isForkedNetwork: ", isForkedNetwork()));

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log(colors.green("\nDEPLOYER ADDRESS is:", deployer));

    const ClayTokenDeployed = await deploy('ClayToken', {
        from: deployer,
        gasLimit: 4000000,
        args: [],
        skipIfAlreadyDeployed: true
    });
    console.log(colors.green("CLAY TOKEN ADDRESS:", ClayTokenDeployed.address));

};

module.exports.tags = ['ClayToken'];