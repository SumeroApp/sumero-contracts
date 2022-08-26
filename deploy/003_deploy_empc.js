/**
 * This script deploys the EMPC (Expiring Multi Party Creator) Contract
 * https://github.com/Signo-App/uma-protocol/blob/master/packages/core/contracts/financial-templates/expiring-multiparty/ExpiringMultiPartyCreator.sol
 * 
 * The EMPC is used by Sumero to deploy new EMPs (Expiring Multi Party) Contracts
 */
const colors = require('colors');
const { getAddress } = require('@uma/contracts-node');
const { expect } = require('chai');
const faucetTokenAbi = require('../utils/faucetToken.abi.json');
const { ethers } = require("hardhat");

// this function is injected with HRE
module.exports = async ({
    getNamedAccounts,
}) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log(colors.bold("\n==> Running 003_deploy_empc script"));

    const KOVAN_NETWORK_ID = 42;
    const GOERLI_NETWORK_ID = 5;

    let empcDeployed;
    let tokenFactoryDeployed;
    let timerContractDeployed;

    // DEPENDENT CONTRACTS BEFORE DEPLOYING EMPC

    // Finder Contract
    // const FINDER_ADDRESS = await getAddress("ExpiringMultiPartyCreator", GOERLI_NETWORK_ID);
    const FINDER_ADDRESS = "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e";
    console.log("FINDER_ADDRESS " + FINDER_ADDRESS);

    // Deploy TokenFactory
    tokenFactoryDeployed = await deploy('TokenFactory', {
        from: deployer,
        skipIfAlreadyDeployed: true
    });

    const TOKEN_FACTORY_ADDRESS = tokenFactoryDeployed.address;
    console.log("TOKEN_FACTORY_ADDRESS " + TOKEN_FACTORY_ADDRESS);

    // Deploy Timer
    timerContractDeployed = await deploy('Timer', {
        from: deployer,
        skipIfAlreadyDeployed: true
    });

    const TIMER_ADDRESS = timerContractDeployed.address;
    console.log("TIMER_ADDRESS " + TIMER_ADDRESS);

    empcDeployed = await deploy('ExpiringMultiPartyCreator', {
        from: deployer,
        args: [FINDER_ADDRESS, TOKEN_FACTORY_ADDRESS, TIMER_ADDRESS],
        skipIfAlreadyDeployed: true
    });

    console.log("DEPLOYED!");
    console.log(empcDeployed);

    const EMPC_ADDRESS = empcDeployed.address;
    console.log("EMPC_ADDRESS " + EMPC_ADDRESS);
};

module.exports.tags = ['EMPC'];
