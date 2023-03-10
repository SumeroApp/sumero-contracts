// npx hardhat emp-request-withdrawal --emp-address <address> --collateral-amount <collateral-amount> --network <network-name>
task("emp-request-withdrawal", "Requests withdrawal")
    .addParam("empAddress", "Deployed EMP contract address")
    .addParam("collateralAmount", "The number of collateral tokens to collateralize the position with")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if trasactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const { deployer } = await getNamedAccounts();
            const { ethers } = require("hardhat")
            const helper = require('../utils/helper');
            const colors = require('colors');
            const submitTransactionToGnosisSafe = require("../gnosis/helper");

            //---- Get Ethers Signer-------------------
            const signer0 = ethers.provider.getSigner(deployer);

            //---- Get EMP Contract--------------------
            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const empInstance = await EMP.attach(args.empAddress);

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

            const collateralCurrencyAddress = await empInstance.collateralCurrency();
            const syntheticDecimals = await empInstance._getSyntheticDecimals(collateralCurrencyAddress);
            const collateralRequirement = Number(ethers.utils.formatUnits(await empInstance.collateralRequirement(), 18));
            const positions = await empInstance.positions(deployer);
            const tokenOutstanding = positions.tokensOutstanding[0];
            const collateralDeposited = positions.collateral[0];
            const withdrawalLiveness = Number(await empInstance.withdrawalLiveness());
            const currentTime = Math.floor(Date.now() / 1000);
            const expirationTimestamp = Number(await empInstance.expirationTimestamp());
            const totalPositionCollateral = await empInstance.totalPositionCollateral();
            const totalTokensOutstanding = await empInstance.totalTokensOutstanding();
            const rawGCR = totalTokensOutstanding.isZero() ? ethers.BigNumber.from(0) : ethers.utils.formatUnits(totalPositionCollateral.mul(ethers.utils.parseEther("1")).div(totalTokensOutstanding), 18);
            const globalCR = rawGCR / price;


            const withdrawAmount = ethers.utils.parseUnits(args.collateralAmount.toString(), syntheticDecimals);
            const updatedCollateral = collateralDeposited - withdrawAmount;
            const calculatedPositionCR = (updatedCollateral / tokenOutstanding) / price;


            console.log(colors.blue("\nEMP Withdrawal Details: "));
            console.log("\n");
            console.log("Current Time -> " + currentTime);
            console.log("Expiration Timestamp -> " + expirationTimestamp);
            console.log("Liquidation Collateral Ratio -> " + collateralRequirement);
            console.log("Withdrawal Liveness -> ", withdrawalLiveness);
            console.log("\n");
            console.log("Collateral Currency Address-> " + collateralCurrencyAddress);
            console.log("Withdraw Amount -> " + ethers.utils.formatUnits(withdrawAmount, syntheticDecimals));
            console.log("Total Position Collateral -> " + ethers.utils.formatUnits(totalPositionCollateral, syntheticDecimals));
            console.log("User Deposited Collateral -> " + ethers.utils.formatUnits(collateralDeposited, syntheticDecimals));
            console.log("Token Outstanding -> " + ethers.utils.formatUnits(tokenOutstanding, syntheticDecimals))
            console.log("Global CR (GCR) -> " + globalCR);


            console.log(colors.blue("\nDetails if withdrawal goes through: "));
            console.log("Future Collateral: " + ethers.utils.formatUnits(updatedCollateral, syntheticDecimals))
            console.log("Future Calculated Position CR -> " + calculatedPositionCR)

            if (calculatedPositionCR < collateralRequirement) {
                console.log("Calculated CR can't be less than the position CR");
                console.log("Position CR " + collateralRequirement + "  Calculated position cr: " + calculatedPositionCR)
                return
            }
            if (expirationTimestamp < currentTime + withdrawalLiveness) {
                console.log("Not enough time for withdrawal request(Expiration time is very close)...")
                return
            }

            if (Number(positions.withdrawalRequestAmount) != 0) {
                console.log("There is an ongoing withdrawal request! Please wait for that to be resulted...")
                return
            }

            const collateralAmountObject = { rawValue: withdrawAmount };

            console.log(colors.blue("\n Requesting Witdrawal: ....."));
            try {
                if (args.gnosisSafe) return submitTransactionToGnosisSafe(args.gnosisSafe, empInstance, 'requestWithdrawal',collateralAmountObject);
                const requestWithdrawalTx = await empInstance.requestWithdrawal(collateralAmountObject);
                const receipt = await requestWithdrawalTx.wait();
                console.log("\nTransaction Receipt: \n", receipt)

                const txUrl = helper.getTxUrl(deployments.getNetworkName(), requestWithdrawalTx.hash);
                if (txUrl != null) {
                    console.log(txUrl);
                }
            } catch (error) {
                console.log("Requesting Witdrawal failed!");
                console.log(error);
            }
        }
    );

module.exports = {};
