// npx hardhat create-emp-params  --life-time <1> --collateral-address <0xb7a4F3E9097C08dA09517b5aB877F7a917224ede> --price-feed <USDETH> --name <Test_USDETH>  --symbol <zUSDETH> --collateral <1.25> --dispute-bond <0.1> --sponsor-dispute-reward <0.05> --disputer-dispute-reward <0.2> --min-sponsor-tokens <100>
// npx hardhat create-emp-params  --life-time 1 --collateral-address 0xb7a4F3E9097C08dA09517b5aB877F7a917224ede --price-feed USDETH --name Test_USDETH  --symbol zUSDETH --collateral 1.25 --dispute-bond 0.1 --sponsor-dispute-reward 0.05 --disputer-dispute-reward 0.2 --min-sponsor-tokens 100

task("create-emp-params", "Deploys the EMP (Expiring Multi Party) Contract using UMA's EMPC")
    .addParam("lifeTime", "Life time in days.")
    .addParam("collateralAddress", "The amount to be minted")
    .addParam("priceFeed", " The plaintext price identifier")
    .addParam("name", "The plaintext synthetic token name")
    .addParam("symbol", "The plaintext synthetic token symbol")
    .addParam("collateral", "The collateralization requirement ratio(e.g. 1.25)")
    .addParam("disputeBond", "Dispute Bond(e.g. 0.1 => 10%")
    .addParam("sponsorDisputeReward", "Dispute reward paid to the position sponsor ")
    .addParam("disputerDisputeReward", "Dispute reward paid to the disputer")
    .addParam("minSponsorTokens", "The minimum number of tokens required in a sponsor position ")
    .setAction(
        async (args, deployments,) => {
            const { deployer } = await getNamedAccounts();
            const colors = require('colors');
            const { expect } = require('chai');
            const { ethers } = require("hardhat")
            const {getTxUrl} = require('../utils/helper');

            const { ExpiringMultiPartyCreatorEthers__factory, ExpiringMultiPartyEthers__factory, getAddress, getAbi } = require('@uma/contracts-node');

            console.log(colors.bold("\n==> Running create-emp-param task..."));

            const KOVAN_NETWORK_ID = 42;

            const UMA_EMPC_ADDRESS = await getAddress("ExpiringMultiPartyCreator", KOVAN_NETWORK_ID);
            console.log(colors.green("\nEMPC_ADDRESS: ", UMA_EMPC_ADDRESS));

            const signer0 = ethers.provider.getSigner(deployer);
            const emp_creator_instance = ExpiringMultiPartyCreatorEthers__factory.connect(UMA_EMPC_ADDRESS, signer0);
            const syntheticDecimals = await emp_creator_instance._getSyntheticDecimals(args.collateralAddress);
            const tokenFactoryAddress = await emp_creator_instance.tokenFactoryAddress();

            console.log(colors.blue("\n Synthetic Decimals for USDC: ", syntheticDecimals));
            console.log(colors.blue("\n Token Factory Address: ", tokenFactoryAddress));

            // Price Feed
            const priceFeedIdentifierHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(args.priceFeed));
            const priceFeedIdentifierPaddedHex = priceFeedIdentifierHex.padEnd(66, '0');

            // Contract tracks percentages and ratios below in FixedPoint vars, with 18 decimals of precision, so parseEther will work
            const createEmpParams = {
                expirationTimestamp: Date.now() + ((args.lifeTime * 24 * 60 * 60) * 1000),
                collateralAddress: args.collateralAddress,
                priceFeedIdentifier: priceFeedIdentifierPaddedHex,
                syntheticName: args.name,
                syntheticSymbol: args.symbol,
                // 1.25 collateralization ratio
                collateralRequirement: {
                    rawValue: ethers.utils.parseEther(args.collateral)
                },
                // 0.1 => 10%
                disputeBondPercentage: {
                    rawValue: ethers.utils.parseEther(args.disputeBond)
                },
                // 0.05 => 5%
                sponsorDisputeRewardPercentage: {
                    rawValue: ethers.utils.parseEther(args.sponsorDisputeReward)
                },
                // 0.2 => 20%
                disputerDisputeRewardPercentage: {
                    rawValue: ethers.utils.parseEther(args.disputerDisputeReward)
                },
                // minSponsorTokens will inherit decimal places from the collateral currency
                // 100 tokens
                minSponsorTokens: {
                    rawValue: ethers.utils.parseUnits(args.minSponsorTokens, syntheticDecimals)
                },
                withdrawalLiveness: 7200,
                liquidationLiveness: 7200,
                financialProductLibraryAddress: '0x0000000000000000000000000000000000000000'
            }

            console.log(colors.blue("\n Creating EMP via EMPC: ....."));
            const createEmpTx = await emp_creator_instance.createExpiringMultiParty(createEmpParams);

            console.log("\nTransaction Receipt: \n",createEmpTx)
            console.log(getTxUrl(deployments.network,createEmpTx.hash))


        }
    );

module.exports = {};
