// npx hardhat emp-verify --emp-address <address>  --deployer <address>  --network <network-name>

task("emp-verify", "Verifies EMP on etherscan")
    .addParam("empAddress", "Address of EMP contract")
    .addParam("deployer", "Deployer address of EMP contract")
    .setAction(
        async (args, hre) => {
            const colors = require('colors');

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            let emp = await EMP.attach(args.empAddress);

            const SYNTH = await hre.ethers.getContractFactory("contracts/UMA/common/implementation/ExpandedERC20.sol:ExpandedERC20");
            let synthAddress = await emp.tokenCurrency();
            const synth = await SYNTH.attach(synthAddress);

            console.log(colors.blue("\n 1-Getting required params from EMP contract: ....."));

            let convertedParams = [{
                expirationTimestamp: await emp.expirationTimestamp(),
                collateralAddress: await emp.collateralCurrency(),
                priceFeedIdentifier: await emp.priceIdentifier(),
                ancillaryData: await emp.ancillaryData(),
                syntheticName: await synth.name(),
                syntheticSymbol: await synth.symbol(),
                collateralRequirement: { rawValue: await emp.collateralRequirement() },
                disputeBondPercentage: { rawValue: await emp.disputeBondPercentage() },
                sponsorDisputeRewardPercentage: { rawValue: await emp.sponsorDisputeRewardPercentage() },
                disputerDisputeRewardPercentage: { rawValue: await emp.disputerDisputeRewardPercentage() },
                minSponsorTokens: { rawValue: await emp.minSponsorTokens() },
                ooReward: { rawValue: await emp.ooReward() },
                withdrawalLiveness: await emp.withdrawalLiveness(),
                liquidationLiveness: await emp.liquidationLiveness(),
                financialProductLibraryAddress: '0x0000000000000000000000000000000000000000',
                tokenAddress: synthAddress,
                finderAddress: '0xE60dBa66B85E10E7Fd18a67a6859E241A243950e',
                owner: args.deployer
            }]

            console.log(colors.blue("\n 2-Verifiying EMP: ....."));

            try {
                await run('verify', {
                    address: args.empAddress,
                    constructorArguments: convertedParams,
                });
                console.log(colors.green("\n EMP successfully verified on etherscan..."));

            } catch (error) {
                console.log(colors.red("\n EMP verification failed..."));
                console.log(error)
            }
            console.log(colors.blue("\n 3-Verifiying Synth: ....."));

            try {
                await run('verify', {
                    address: args.empAddress,
                    constructorArguments: [await synth.name(), await synth.symbol(), await synth.decimals()],
                });
                console.log(colors.green("\n Synth successfully verified on etherscan..."));

            } catch (error) {
                console.log(colors.red("\n Synth verification failed..."));
                console.log(error)
            }
        }
    );