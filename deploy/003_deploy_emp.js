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
}) => {
    const { deployer } = await getNamedAccounts();

    console.log(colors.bold("\n==> Running 003_deploy_emp script"));

    const KOVAN_NETWORK_ID = 42;
    // date 2 days in the future
    const expirationTimestamp = Math.floor(Date.now()/1000) + (30 * 24 * 3600); // three months hence

    const KOVAN_USDC = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede';
    const UMA_EMPC_ADDRESS = await getAddress("ExpiringMultiPartyCreator", KOVAN_NETWORK_ID);
    console.log(colors.green("\nEMPC_ADDRESS: ", UMA_EMPC_ADDRESS));
    console.log(colors.green("\nKOVAN_USDC: ", KOVAN_USDC));

    const signer0 = ethers.provider.getSigner(deployer);
    const emp_creator_instance = ExpiringMultiPartyCreatorEthers__factory.connect(UMA_EMPC_ADDRESS, signer0);
    const syntheticDecimals = await emp_creator_instance._getSyntheticDecimals(KOVAN_USDC);
    const tokenFactoryAddress = await emp_creator_instance.tokenFactoryAddress();

    console.log(colors.blue("\n Synthetic Decimals for USDC: ", syntheticDecimals));
    console.log(colors.blue("\n Token Factory Address: ", tokenFactoryAddress));

    // Important Parameters
    // - An approved collateral token (e.g. kovan USDC, mainnet WETH)
    // - An approved price identifier (e.g. ethVIX/USDC). Therse are approved via UIMPs UMA Improvement Proposals
    // - Minimum Collateral Amount (i.e. 125%)

    // https://docs.umaproject.org/build-walkthrough/emp-parameters
    // values are scaled to 18 decimals

    const priceFeedIdentifierHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("ETHUSD"));
    const priceFeedIdentifierPaddedHex = priceFeedIdentifierHex.padEnd(66, '0');
    
    // Taking into account the price feed, under what collateralization can a sponsor be liquidated?
    const collateralRequirement = 1.25;

    // How many units of collateral do we initially want for every unit of the synthetic asset?
    const initialTokenRatio = 1500; // at $1k/ETH, this is 150% collateraliztion
    const minSponsorTokens = 0.5;

    // Contract tracks percentages and ratios below in FixedPoint vars, with 18 decimals of precision, so parseEther will work
    // (unless specifying token amount)
    const createEmpParams = {
        expirationTimestamp: expirationTimestamp,
        collateralAddress: KOVAN_USDC,
        priceFeedIdentifier: priceFeedIdentifierPaddedHex,
        syntheticName: 'Synthetic ETH',
        syntheticSymbol: 'sETH',
        // 1.25 collateralRequirement
        collateralRequirement: {
            rawValue: ethers.utils.parseEther(collateralRequirement.toString())
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
        // minSponsorTokens will inherit decimal places from the collateral currency
        minSponsorTokens: {
            rawValue: ethers.utils.parseUnits(minSponsorTokens.toString(), syntheticDecimals)
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
    console.log(colors.blue("  totalPositionCollateral: ", (await empInstance.totalPositionCollateral()).toString()));
    console.log(colors.blue("  minSponsorTokens: ", (await empInstance.minSponsorTokens()).toString()));
    console.log(colors.blue("  collateralCurrency: ", await empInstance.collateralCurrency()));
    console.log(colors.blue("  tokenCurrency: ", syntheticTokenAddress));
    console.log(colors.blue("  collateralRequirement: ", (await empInstance.collateralRequirement()).toString()));
    console.log(colors.blue("  expirationTimestamp: ", (await empInstance.expirationTimestamp()).toString()));

    // Pre-Approval steps for creating EMP synths
    // Approve EMP contract to spend collateral
    
    const usdcInstance = new ethers.Contract(KOVAN_USDC, faucetTokenAbi, signer0);
    console.log(colors.blue("\n  Allocating USDC: ....."));
    await usdcInstance.allocateTo(deployer, ethers.utils.parseUnits('100000', syntheticDecimals));
    console.log(colors.blue("\n  Approving allowance of USDC to EMP: ....."));
    await usdcInstance.approve(expiringMultiPartyAddress, ethers.utils.parseUnits('100000', syntheticDecimals));

    const syntheticTokenInstance = new ethers.Contract(syntheticTokenAddress, getAbi('SyntheticToken'), signer0);
    console.log(colors.green("\n Synth Balance: ", (await syntheticTokenInstance.balanceOf(deployer)).toString()));

    // creating synths
    console.log(colors.blue("\n About to Mint Initial Synth Tokens:"));

    const collateralAmount = minSponsorTokens * initialTokenRatio;

    console.log(colors.blue('\n  Minimum mintable synthetic tokens: ' + minSponsorTokens.toString()));
    console.log(colors.blue('  With an initial token ratio of ' + initialTokenRatio.toString() + "..."));
    console.log(colors.blue('  ' + collateralAmount.toString() + ' tokens of collateral is needed.'));
    console.log(colors.blue('\n  Minting...'));

    const collateralAmountObject = { rawValue: ethers.utils.parseUnits(collateralAmount.toString(), syntheticDecimals) };
    const numTokensObject = { rawValue: ethers.utils.parseUnits(minSponsorTokens.toString(), syntheticDecimals) };

    await empInstance.create(collateralAmountObject, numTokensObject);

    console.log(colors.blue("\nEMP Details after minting synth: "));
    console.log(colors.blue("  rawTotalPositionCollateral: ", (await empInstance.rawTotalPositionCollateral()).toString()));
    console.log(colors.blue("  cumulativeFeeMultiplier: ", (await empInstance.cumulativeFeeMultiplier()).toString()));
    console.log(colors.blue("  totalTokensOutstanding: ", (await empInstance.totalTokensOutstanding()).toString()));
    console.log(colors.blue("  totalPositionCollateral: ", (await empInstance.totalPositionCollateral()).toString()));
    console.log(colors.blue("  minSponsorTokens: ", (await empInstance.minSponsorTokens()).toString()));
    console.log(colors.blue("  collateralCurrency: ", await empInstance.collateralCurrency()));
    console.log(colors.blue("  tokenCurrency: ", syntheticTokenAddress));
    console.log(colors.blue("  collateralRequirement: ", (await empInstance.collateralRequirement()).toString()));
    console.log(colors.blue("  expirationTimestamp: ", (await empInstance.expirationTimestamp()).toString()));

    console.log(colors.green("\n Synth Balance: ", ethers.utils.formatUnits((await syntheticTokenInstance.balanceOf(deployer)).toString(), syntheticDecimals)));
};

module.exports.tags = ['ExpiringMultiParty'];
