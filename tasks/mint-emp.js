
// npx hardhat mint-emp --emp-address <0xf29F8f53203D2E173710a53E7453b2E20e1F87B6> --emp-deployer-address <0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7> --initial-token-ratio <30000>
// npx hardhat mint-emp --emp-address 0xf29F8f53203D2E173710a53E7453b2E20e1F87B6 --emp-deployer-address 0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7 --initial-token-ratio 30000
task("mint-emp", "Mint the EMP")
    .addParam("empAddress", "Emp Contract dddress")
    .addParam("empDeployerAddress", "Emp deployer address")
    .addParam("initialTokenRatio", "Initial token ratio")

    .setAction(
        async (args, deployments) => {
            const { deployer } = await getNamedAccounts();
            const colors = require('colors');
            const { ethers } = require("hardhat")
            const { getTxUrl } = require('../utils/helper');

            const { ExpiringMultiPartyCreatorEthers__factory, ExpiringMultiPartyEthers__factory, getAbi, getAddress } = require('@uma/contracts-node');
            const signer0 = ethers.provider.getSigner(deployer);
            const faucetTokenAbi = require('../utils/faucetToken.abi.json');
            const KOVAN_USDC = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede';
            const KOVAN_NETWORK_ID = 42;
            const UMA_EMPC_ADDRESS = await getAddress("ExpiringMultiPartyCreator", KOVAN_NETWORK_ID);
            // Mint Synths
            console.log(colors.blue("\n Mint Synths using EMP: ....."));

            const empInstance = ExpiringMultiPartyEthers__factory.connect(args.empAddress, signer0);
            const syntheticTokenAddress = await empInstance.tokenCurrency();
            const emp_creator_instance = ExpiringMultiPartyCreatorEthers__factory.connect(UMA_EMPC_ADDRESS, signer0);
            const syntheticDecimals = await emp_creator_instance._getSyntheticDecimals(KOVAN_USDC);
            const minSponsorTokens = ethers.utils.formatUnits((await empInstance.minSponsorTokens()).toString(), syntheticDecimals);
            const collateralAmount = minSponsorTokens * args.initialTokenRatio;

            // Get EMP details
            console.log(colors.blue("\nEMP Deployed at: ", args.empAddress));
            console.log(colors.blue("  deployed by: ", args.empDeployerAddress));
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
            await usdcInstance.approve(args.empAddress, ethers.utils.parseUnits('100000', syntheticDecimals));

            const syntheticTokenInstance = new ethers.Contract(syntheticTokenAddress, getAbi('SyntheticToken'), signer0);
            console.log(colors.green("\n Synth Balance: ", (await syntheticTokenInstance.balanceOf(deployer)).toString()));

            console.log(colors.blue("\n About to Mint Initial Synth Tokens:"));
            console.log(colors.blue('\n  Minimum mintable synthetic tokens: ' + minSponsorTokens.toString()));
            console.log(colors.blue('  With an initial token ratio of ' + args.initialTokenRatio.toString() + "..."));
            console.log(colors.blue('  ' + collateralAmount.toString() + ' tokens of collateral is needed.'));
            console.log(colors.blue('\n  Minting...'));

            const collateralAmountObject = { rawValue: ethers.utils.parseUnits(collateralAmount.toString(), syntheticDecimals) };
            const numTokensObject = { rawValue: ethers.utils.parseUnits(minSponsorTokens.toString(), syntheticDecimals) };
            
            let mintEmpTx;
            try {
                mintEmpTx = await empInstance.create(collateralAmountObject, numTokensObject);
                await mintEmpTx.wait()
            } catch (error) {
                console.log(error)
            }

            console.log("\nTransaction Receipt: \n", mintEmpTx)


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

            const txUrl = getTxUrl(deployments.network, mintEmpTx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            } 
        }
    );

module.exports = {};

