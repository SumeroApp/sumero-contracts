// hardhat
const { expect } = require("chai");
const { isLocalNetwork, isForkedNetwork } = require('../utils/helper');
const colors = require('colors');
const { ethers, web3 } = require("hardhat");
const { ExpiringMultiPartyCreatorEthers__factory, getAddress } = require("@uma/contracts-node");
// const { getExpiringMultiPartyAbi } = require("@uma/contracts-node");

// this function is injected with HRE
module.exports = async ({
    getNamedAccounts,
    deployments,
    network,
}) => {

    console.log(colors.blue("\n Running 003_deploy_synths script"));

    //  Use IExpiringMultiParty
    const { deploy } = deployments;
    const { deployer, sumeroTestUser } = await getNamedAccounts();

    const networkId = await ethers.provider.getNetwork();
    console.log(colors.yellow("\n Network Details: ", networkId));

    const KOVAN_NETWORK_ID = 42;

    const UMA_EMPC_ADDRESS = await getAddress("ExpiringMultiPartyCreator", KOVAN_NETWORK_ID);
    console.log(colors.yellow("\nEMPC_ADDRESS: ", UMA_EMPC_ADDRESS));


    console.log(colors.yellow("\nProvider Details: ", ethers.provider));
    let signer0 = ethers.provider.getSigner(0);
    console.log(colors.yellow("\nSigner Details: ", signer0));

    const empcInstance = ExpiringMultiPartyCreatorEthers__factory.connect(UMA_EMPC_ADDRESS, signer0);
    // console.log(colors.yellow("\nEMPC Instance: ", empcInstance));
    console.log(colors.yellow("\n \n ......"));

    // params: {
    //     expirationTimestamp: BigNumberish;
    //     collateralAddress: string;
    //     priceFeedIdentifier: BytesLike;
    //     syntheticName: string;
    //     syntheticSymbol: string;
    //     collateralRequirement: { rawValue: BigNumberish };
    //     disputeBondPercentage: { rawValue: BigNumberish };
    //     sponsorDisputeRewardPercentage: { rawValue: BigNumberish };
    //     disputerDisputeRewardPercentage: { rawValue: BigNumberish };
    //     minSponsorTokens: { rawValue: BigNumberish };
    //     withdrawalLiveness: BigNumberish;
    //     liquidationLiveness: BigNumberish;
    //     financialProductLibraryAddress: string;
    //   }

    const KOVAN_WETH = '0xd0a1e359811322d97991e03f863a0c30c2cf029c';
    // KOVAN USDC??

    const synthParams = {
        expirationTimestamp: '1650031113',
        collateralAddress: KOVAN_WETH,
        priceFeedIdentifier: web3.utils.padRight(web3.utils.utf8ToHex('USDC/SYNTH'), 64),
        syntheticName: 'Test zSynth',
        syntheticSymbol: 'TzSynth',
        collateralRequirement: {
            rawValue: web3.utils.toWei('0.1')
        },
        disputeBondPercentage: {
            rawValue: web3.utils.toWei('0.1')
        },
        sponsorDisputeRewardPercentage: {
            rawValue: web3.utils.toWei('0.1')
        },
        disputerDisputeRewardPercentage: {
            rawValue: web3.utils.toWei('0.1')
        },
        minSponsorTokens: {
            rawValue: web3.utils.toWei('0.1')
        },
        withdrawalLiveness: 7200,
        liquidationLiveness: 7200,
        financialProductLibraryAddress: '0x0000000000000000000000000000000000000000'
    }

    // console.log(colors.yellow(await empcInstance.createExpiringMultiParty()));

    // Must give some pre-appovals to the EMP contract or something before calling this function??
    const empTx = await empcInstance.createExpiringMultiParty(synthParams);
    console.log('empTx', empTx);
    const emp = tx.receipt.rawLogs[4].topics[1].replace('0x000000000000000000000000', '0x');
    console.log('emp', emp);


};