/**
 * npx hardhat emp-create  
 *      --life-time <period-in-days> 
 *      --collateral-address <address> 
 *      --price-feed <plain-text-price-feed-identifier> 
 *      --synth-name <synth-name>  
 *      --synth-symbol <zUSDETH> 
 *      --collateralRequirement <The collateralization requirement ratio (e.g. 1.25)> 
 *      --dispute-bond <Dispute Bond (e.g. 0.1 => 10%)> 
 *      --sponsor-dispute-reward <Dispute reward paid to the position sponsor> 
 *      --disputer-dispute-reward <Dispute reward paid to the disputer> 
 *      --min-sponsor-tokens <The minimum number of tokens required in a sponsor position>
 *  */
// npx hardhat emp-create --life-time 1 --collateral-address 0xb7a4F3E9097C08dA09517b5aB877F7a917224ede --price-feed USDETH --ancillary-data 0x73756d65726f3a205573657320746865204e554d45524943414c207072696365206665656420746f20717565727920445859 --synth-name Test_USDETH  --synth-symbol zUSDETH --collateral-requirement 1.25 --dispute-bond 0.1 --sponsor-dispute-reward 0.05 --disputer-dispute-reward 0.2 --min-sponsor-tokens 0.02

task("emp-create", "Deploys the EMP (Expiring Multi Party) Contract using UMA's EMPC")
    .addParam("expirationTimestamp", "synth expiration timestamp in epoch seconds")
    .addParam("withdrawalLiveness", "synth withdrawalLiveness in seconds")
    .addParam("liquidationLiveness", "synth liquidationLiveness in seconds")
    .addParam("collateralAddress", "address of collateral to be used")
    .addParam("priceFeed", " The plaintext price identifier e.g. USDETH")
    .addParam("ancillaryData", "ancillary data augment price identifier")
    .addParam("synthName", "The plaintext synthetic token name")
    .addParam("synthSymbol", "The plaintext synthetic token symbol")
    .addParam("collateralRequirement", "The collateralization requirement ratio (e.g. 1.25)")
    .addParam("disputeBond", "Dispute Bond (e.g. 0.1 => 10%)")
    .addParam("sponsorDisputeReward", "Dispute reward paid to the position sponsor")
    .addParam("disputerDisputeReward", "Dispute reward paid to the disputer")
    .addParam("minSponsorTokens", "The minimum number of tokens required in a sponsor position")
    .addParam("ooReward", "How much of the collateral to offer to the Optimistic Oracle system when requesting a price")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if transactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {

            const { deployments, getNamedAccounts } = hre;
            const { deployer, ...rest } = await getNamedAccounts();

            const { getTxUrl } = require('../utils/helper');
            const colors = require('colors');
            const getGnosisSigner = require('../gnosis/signer');

            const { ExpiringMultiPartyCreatorEthers__factory } = require('@uma/contracts-node');

            console.log(colors.bold("\n==> Running create-emp task..."), { deployer, rest });

            let emp_creator_instance = await hre.ethers.getContract("ExpiringMultiPartyCreator", deployer);
            if (args.gnosisSafe) {
                emp_creator_instance = emp_creator_instance.connect(await getGnosisSigner(args.gnosisSafe))
            }

            const ExpiringMultiPartyCreator = await deployments.get("ExpiringMultiPartyCreator");
            console.log(colors.green("\nEMPC_ADDRESS: ", ExpiringMultiPartyCreator.address));
            if (!ExpiringMultiPartyCreator || !ExpiringMultiPartyCreator.address) throw new Error("Unable to get deployed EMPC address");


            // const emp_creator_instance = ExpiringMultiPartyCreatorEthers__factory.connect(ExpiringMultiPartyCreator.address, signer0);
            const syntheticDecimals = await emp_creator_instance._getSyntheticDecimals(args.collateralAddress);
            const collateralDecimals = syntheticDecimals; // The EMP Solidity code sets these to be the same on every EMP creation.
            const tokenFactoryAddress = await emp_creator_instance.tokenFactoryAddress();

            console.log(colors.blue("\n Synthetic Decimals for USDC: ", syntheticDecimals));
            console.log(colors.blue("\n Token Factory Address: ", tokenFactoryAddress));

            // Price Feed
            const priceFeedIdentifierHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(args.priceFeed));
            const priceFeedIdentifierPaddedHex = priceFeedIdentifierHex.padEnd(66, '0');

            console.log("\n life time in days: ", Math.round((Number(args.expirationTimestamp) - (Date.now()/1000))/(60 * 60 * 24)), " => expires in: ", Math.round(Number(args.expirationTimestamp) - (Date.now()/1000)), " seconds");
            console.log(" expirationTimestamp: ", args.expirationTimestamp);

            // Contract tracks percentages and ratios below in FixedPoint vars, with 18 decimals of precision, so parseEther will work
            const createEmpParams = {
                expirationTimestamp: args.expirationTimestamp,
                collateralAddress: args.collateralAddress,
                priceFeedIdentifier: priceFeedIdentifierPaddedHex,
                ancillaryData: args.ancillaryData,
                syntheticName: args.synthName,
                syntheticSymbol: args.synthSymbol,
                // 1.25 collateralization ratio
                collateralRequirement: {
                    rawValue: ethers.utils.parseEther(args.collateralRequirement)
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
                ooReward: {
                    rawValue: ethers.utils.parseUnits(args.ooReward, collateralDecimals)
                },
                withdrawalLiveness: args.withdrawalLiveness,
                liquidationLiveness: args.liquidationLiveness,
                financialProductLibraryAddress: '0x0000000000000000000000000000000000000000'
            }

            console.log(colors.blue("\n Creating EMP via EMPC: ....."));
            try {
                const createEmpTx = await emp_creator_instance.createExpiringMultiParty(createEmpParams, { gasLimit: 6700000 });
                const receipt = await createEmpTx.wait();
                console.log("\nTransaction Receipt: \n", createEmpTx);

                const createdEmpSignature = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes('CreatedExpiringMultiParty(address,address)'))
                let expiringMultiPartyAddress = (receipt.logs.filter(log => log.topics.includes(createdEmpSignature)))[0].topics[1].replace('0x000000000000000000000000', '0x');
                console.log("Expiring Multi Party Address: " + expiringMultiPartyAddress);

                const txUrl = getTxUrl(deployments.getNetworkName(), createEmpTx.hash);
                if (txUrl != null) {
                    console.log(txUrl);
                }
                return expiringMultiPartyAddress
            } catch (error) {
                console.log("createExpiringMultiParty failed!");
                console.log(error);
            }
        }
    );

module.exports = {};