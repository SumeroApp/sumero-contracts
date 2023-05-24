/**
 *  What all does the task need in order to do a successful initial mint?
 *  - Price of the identifier i.e. ETHUSD http://18.219.111.187/prices.json
 *  - Actual CR to use is max(rawGCR, position CR Ratio)
 *      - rawGCR => 0 => globalCR =>0 (this happens because totalTokensOutstanding is 0)
 *      - position CR Ratio => collateralRequirement + 0.15 i.e. 1.25 + 0.15 => 1.40 => 140%
 *  - minSponsorToken => 0.02 (20000/10^6(collateralDecimals))
 *  - Provide Either one of these
 *      - Optional Argument: Collateral provided
 *      - Optional Argument: NumOfTokens provided
 * 
 *  - You provide $1000 collateral
 *  - numOfTokens = collateralAmount / (price * CR ratio)
 *  - numOfTokens = 1000 / (1700*1.40) => 0.42
 * 
 *  - You provide numOfTokens e.g. 10 tokens
 *  - collateralNeeded = (price * CR ratio) * numOfTokens
 * */

/**
 *  What all does the task need in order to do successive mint?
 *  - Price of the identifier i.e. ETHUSD http://18.219.111.187/prices.json
 *  - Actual CR to use is max(globalCR, position CR Ratio)
 *      - rawGCR => totalTokensOutstandingUint.isZero() ? ethers.BigNumber.from(0) : totalPositionCollateralUint.mul(cumulativeFeeMultiplier).div(totalTokensOutstandingUint);
 *      - globalCR => formatEther(rawGCR)/price     
 *      - position CR Ratio => collateralRequirement + 15%
 * */
// npx hardhat emp-mint --network <network-name> --emp-address <address> --collateral-amount <collateral-amount> --additional-collateral-ratio <additional collateral ratio (e.g. 0.15 => 15%)>
task("emp-mint", "Mint the EMP")
    .addParam("empAddress", "Deployed EMP contract address")
    .addParam("collateralAmount", "The number of collateral tokens to collateralize the position with")
    .addParam("additionalCollateralRatio", "Additional collateral ratio (e.g. 0.15)")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if transactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const { expect } = require('chai');
            const { deployer } = await getNamedAccounts();
            const { ethers } = require("hardhat");
            const helper = require('../utils/helper');
            const colors = require('colors');
            const getGnosisSigner = require('../gnosis/signer');

            //---- Get Ethers Signer-------------------
            const signer0 = ethers.provider.getSigner(deployer);

            //---- Get EMP Contract--------------------
            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            let empInstance = await EMP.attach(args.empAddress);
            if (args.gnosisSafe) {
                empInstance = empInstance.connect(await getGnosisSigner(args.gnosisSafe))
            }

            //----- Fetch Price-------------------------
            let price = ""
            try {
                const hexlifiedPriceIdentifier = await empInstance.priceIdentifier();
                const hexlifiedAncillaryData = await empInstance.ancillaryData();
                price = await helper.getPriceFromIdentifier(hexlifiedPriceIdentifier, hexlifiedAncillaryData);
            }
            catch (error) {
                console.log(colors.red("\n Fetch Price Feed Error. Mint EMP Task Failed: ....."));
                console.log(error);
                return;
            }

            //---- Calculations--------------------

            const collateralCurrency = await empInstance.collateralCurrency();
            const syntheticDecimals = await empInstance._getSyntheticDecimals(collateralCurrency);
            console.log("\nCollateral Currency Details: ");
            console.log("Collateral Currency -> " + collateralCurrency);
            console.log("Collateral Decimals -> " + syntheticDecimals);

            const minSponsorToken = ethers.utils.formatUnits(await empInstance.minSponsorTokens(), syntheticDecimals);
            const totalPositionCollateral = ethers.BigNumber.from(await empInstance.totalPositionCollateral());
            const totalTokensOutstanding = ethers.BigNumber.from(await empInstance.totalTokensOutstanding());

            const collateralRequirement = await empInstance.collateralRequirement();
            const additionalCollateralRatio = ethers.utils.parseUnits(args.additionalCollateralRatio, "ether");
            const positionCrRatio = ethers.BigNumber.from(collateralRequirement).add(additionalCollateralRatio);

            const rawGCR = totalTokensOutstanding.isZero() ? ethers.BigNumber.from(0) : totalPositionCollateral.mul(ethers.utils.parseEther("1")).div(totalTokensOutstanding);
            const globalCR = (ethers.utils.formatUnits(rawGCR, 18)) / price;
            const actualCR = Math.max(Number(globalCR), Number(ethers.utils.formatEther(positionCrRatio)));

            console.log("\nToken Minting Requirements: ");
            console.log("Minimum Synthetic to be minted -> " + minSponsorToken);
            console.log("Total Position Collateral -> " + ethers.utils.formatUnits(totalPositionCollateral, syntheticDecimals));
            console.log("Total Outstanding Tokens -> " + ethers.utils.formatUnits(totalTokensOutstanding, syntheticDecimals));

            console.log("\nCollateralization Ratio: ");
            console.log("collateral Ratio -> " + ethers.utils.formatEther(collateralRequirement));
            console.log("additionalCollateralRatio (argument to Mint EMP task) -> " + ethers.utils.formatEther(additionalCollateralRatio));
            console.log("Position Collateral Requirement Ratio (pCR) (CR + additional CR) -> " + ethers.utils.formatEther(positionCrRatio));
            console.log("Raw GCR (total position collateral/total outstanding tokens): " + ethers.utils.formatEther(rawGCR));
            console.log("Global Collateralization Ratio (GCR=rawGCR/price): " + globalCR);
            console.log("ActualCR (max(GCR, pCR)): " + actualCR);

            const numOfTokens = args.collateralAmount / (price * actualCR);
            const fixedNumOfTokens = (numOfTokens.toFixed(6));
            console.log("\nNumber of Synthetic Tokens that will be minted: " + fixedNumOfTokens);
            expect(Number(fixedNumOfTokens)).to.be.gt(Number(minSponsorToken), "Cannot MINT!, since number of synthetic tokens to be minted is less than minimum synthetic to be minted. Add more collateral and try again!");

            const collateralAmountObject = { rawValue: ethers.utils.parseUnits((args.collateralAmount).toString(), syntheticDecimals) };
            const numTokensObject = { rawValue: ethers.utils.parseUnits(fixedNumOfTokens.toString(), syntheticDecimals) };

            //---- Approve EMP contract to spend collateral--------------------
            // const usdcInstance = new ethers.Contract(KOVAN_USDC, faucetTokenAbi, signer0)
            // await usdcInstance.allocateTo(deployer, ethers.utils.parseUnits(collateralAmount.toString(), syntheticDecimals))
            // await usdcInstance.approve(empAddress, ethers.utils.parseUnits(collateralAmount.toString(), syntheticDecimals)) 

            let mintEmpTx;
            let txUrl;
            try {
                mintEmpTx = await empInstance.create(collateralAmountObject, numTokensObject)
                await mintEmpTx.wait()
                txUrl = helper.getTxUrl(hre.deployments.getNetworkName(), mintEmpTx.hash)
                console.log("\nTransaction Receipt: \n", mintEmpTx)
                if (txUrl != null) {
                    console.log(colors.yellow("\n", txUrl));
                }
            } catch (error) {
                console.log(colors.red("\n Minting EMP failed: ....."));
                console.log(error)
                throw error
            }
        }
    );

module.exports = {};
