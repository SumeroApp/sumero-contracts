/**
 * This script deploys the EMP (Expiring Multi Party) Contract using UMA's EMPC (Expiring Multi Party Creator) Contract
 * 
 * The EMP contract deploys a SyntheticToken which represents the synth.
 */
const colors = require('colors');
const { ExpiringMultiPartyCreatorEthers__factory, ExpiringMultiPartyEthers__factory, getAddress, getAbi } = require('@uma/contracts-node');
const { expect } = require('chai');
const faucetTokenAbi = require('../utils/faucetToken.abi.json');
const { ethers } = require("hardhat")

// this function is injected with HRE
module.exports = async ({
    getNamedAccounts,
    deployments,
    network,
}) => {

    const { deployer, sumeroTestUser } = await getNamedAccounts();

    console.log(colors.bold("\n==> Running 003_deploy_emp script"));

    const KOVAN_NETWORK_ID = 42;
    const KOVAN_USDC = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede';
    const UMA_EMPC_ADDRESS = await getAddress("ExpiringMultiPartyCreator", KOVAN_NETWORK_ID);
    console.log(colors.green("\nEMPC_ADDRESS: ", UMA_EMPC_ADDRESS));
    console.log(colors.green("\nKOVAN_USDC: ", KOVAN_USDC));

    const signer0 = ethers.provider.getSigner(deployer);
    const emp_creator_instance = ExpiringMultiPartyCreatorEthers__factory.connect(UMA_EMPC_ADDRESS, signer0);

    console.log(colors.blue("\n Synthetic Decimals for USDC: ", await emp_creator_instance._getSyntheticDecimals(KOVAN_USDC)));
    console.log(colors.blue("\n Token Factory Address: ", await emp_creator_instance.tokenFactoryAddress()));

    // Important Parameters
    // - An approved collateral token (e.g. kovan USDC, mainnet WETH)
    // - An approved price identifier (e.g. ethVIX/USDC). Therse are approved via UIMPs UMA Improvement Proposals
    // - Minimum Collateral Amount (i.e. 125%)

    // date 2 days in the future
    const expirationTimestamp = Date.now() + (2 * 24 * 3600 * 1000);

    // https://docs.umaproject.org/build-walkthrough/emp-parameters
    // values are scaled to 18 decimals

    const priceFeedIdentifierHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("USDETH"));
    const priceFeedIdentifierPaddedHex = priceFeedIdentifierHex.padEnd(66, '0');
    const createEmpParams = {
        expirationTimestamp: expirationTimestamp,
        collateralAddress: KOVAN_USDC,
        priceFeedIdentifier: priceFeedIdentifierPaddedHex,
        syntheticName: 'Test USDETH',
        syntheticSymbol: 'zUSDETH',
        // 1.25 collateralization ratio
        collateralRequirement: {
            rawValue: ethers.utils.parseEther('1.25')
        },
        // 0.1 => 10%
        disputeBondPercentage: {
            rawValue: ethers.utils.parseEther('0.1')
        },
        // 0.05 => 5%
        sponsorDisputeRewardPercentage: {
            rawValue: ethers.utils.parseEther('0.05')
        },
        // 0.2 => 20%
        disputerDisputeRewardPercentage: {
            rawValue: ethers.utils.parseEther('0.2')
        },
        // 100 tokens
        minSponsorTokens: {
            rawValue: ethers.utils.parseEther('100')
        },
        withdrawalLiveness: 7200,
        liquidationLiveness: 7200,
        financialProductLibraryAddress: '0x0000000000000000000000000000000000000000'
    }

    console.log(colors.blue("\n Creating EMP via EMPC: ....."));
    const createEmpTx = await emp_creator_instance.createExpiringMultiParty(createEmpParams);
    // console.log('Create EMP Transaction : ', createEmpTx);

    const receipt = await createEmpTx.wait()
    // console.log('Create EMP receipt : ', receipt);

    // CreatedExpiringMultiParty(address,address)
    // keccak-256 hash
    // f360b00b309dfe6565667df6b06eab15d0e0958d5e82d89a399ae7dd417b4b09

    let expiringMultiPartyAddress;
    let empDeployerAddress;

    expect(receipt.logs[7].topics[0].replace('0x', '')).to.equal(
        'f360b00b309dfe6565667df6b06eab15d0e0958d5e82d89a399ae7dd417b4b09',
        "CreatedExpiringMultiParty Not Found"
    );

    console.log(colors.green("\nCreatedExpiringMultiParty Event Found!"));
    expiringMultiPartyAddress = receipt.logs[7].topics[1].replace('0x000000000000000000000000', '0x');
    empDeployerAddress = receipt.logs[7].topics[2].replace('0x000000000000000000000000', '0x');

    // Mint Synths
    // 
    console.log(colors.blue("\n Mint Synths using EMP: ....."));

    const empInstance = ExpiringMultiPartyEthers__factory.connect(expiringMultiPartyAddress, signer0);
    const syntheticTokenAddress = await empInstance.tokenCurrency();
    // expect(await empInstance.collateralCurrency()).to.equal(KOVAN_USDC, "Collateral Currency doesn't match");
    // expect(await empInstance.collateralRequirement()).to.equal('1250000000000000000', "Collateral Requirement doesn't match");

    // Get EMP details
    console.log(colors.blue("\nEMP Deployed at: ", expiringMultiPartyAddress));
    console.log(colors.blue("  deployed by: ", empDeployerAddress));
    console.log(colors.blue("  rawTotalPositionCollateral: ", (await empInstance.rawTotalPositionCollateral()).toString()));
    console.log(colors.blue("  cumulativeFeeMultiplier: ", (await empInstance.cumulativeFeeMultiplier()).toString()));
    console.log(colors.blue("  totalTokensOutstanding: ", (await empInstance.totalTokensOutstanding()).toString()));
    console.log(colors.blue("  totalPositionCollateral: ", await empInstance.totalPositionCollateral()).toString());
    console.log(colors.blue("  minSponsorTokens: ", (await empInstance.minSponsorTokens()).toString()));
    console.log(colors.blue("  collateralCurrency: ", await empInstance.collateralCurrency()));
    console.log(colors.blue("  tokenCurrency: ", syntheticTokenAddress));
    console.log(colors.blue("  collateralRequirement: ", (await empInstance.collateralRequirement()).toString()));
    console.log(colors.blue("  expirationTimestamp: ", (await empInstance.expirationTimestamp()).toString()));

    // Pre-Approval steps for creating EMP synths
    // Approve EMP contract to spend collateral
    // Calculate GCR for 1st time minting
    // Calculate min. no. of tokens
    // Calculate min. no. of collateral
    const usdcInstance = new ethers.Contract(KOVAN_USDC, faucetTokenAbi, signer0);
    console.log(colors.blue("\n  Allocating USDC: ....."));
    await usdcInstance.allocateTo(deployer, ethers.utils.parseEther('100000'));
    console.log(colors.blue("\n  Approving allowance of USDC to EMP: ....."));
    await usdcInstance.approve(expiringMultiPartyAddress, ethers.utils.parseEther('1000'));

    const syntheticTokenInstance = new ethers.Contract(syntheticTokenAddress, getAbi('SyntheticToken'), signer0);
    console.log(colors.green("\n Synth Balance: ", (await syntheticTokenInstance.balanceOf(deployer)).toString()));

    console.log(colors.blue("\n Creating Synths: ....."));
    // creating synths
    const collateralAmount = { rawValue: ethers.utils.parseEther('10') };
    const numTokens = { rawValue: ethers.utils.parseEther('100') };
    console.log(colors.blue("  collateralAmount: ", collateralAmount));
    console.log(colors.blue("  numTokens: ", numTokens));
    await empInstance.create(collateralAmount, numTokens);

    console.log(colors.blue("\nEMP Details after minting synth: "));
    console.log(colors.blue("  rawTotalPositionCollateral: ", (await empInstance.rawTotalPositionCollateral()).toString()));
    console.log(colors.blue("  cumulativeFeeMultiplier: ", (await empInstance.cumulativeFeeMultiplier()).toString()));
    console.log(colors.blue("  totalTokensOutstanding: ", (await empInstance.totalTokensOutstanding()).toString()));
    console.log(colors.blue("  totalPositionCollateral: ", await empInstance.totalPositionCollateral()).toString());
    console.log(colors.blue("  minSponsorTokens: ", (await empInstance.minSponsorTokens()).toString()));
    console.log(colors.blue("  collateralCurrency: ", await empInstance.collateralCurrency()));
    console.log(colors.blue("  tokenCurrency: ", syntheticTokenAddress));
    console.log(colors.blue("  collateralRequirement: ", (await empInstance.collateralRequirement()).toString()));
    console.log(colors.blue("  expirationTimestamp: ", (await empInstance.expirationTimestamp()).toString()));

    console.log(colors.green("\n Synth Balance: ", (await syntheticTokenInstance.balanceOf(deployer)).toString()));
};

module.exports.tags = ['ExpiringMultiParty'];
