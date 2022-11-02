// npx hardhat emp-request-withdrawal --emp-address <address> --collateral-amount <collateral-amount> --network <network-name>
task("emp-request-withdrawal", "Requests withdrawal")
    .addParam("empAddress", "Deployed EMP contract address")
    .addParam("collateralAmount", "The number of collateral tokens to collateralize the position with")
    .addParam("priceFeed", "Price feed of EMP")
    .setAction(
        async (args, hre) => {
            const { expect } = require('chai');
            const { deployer } = await getNamedAccounts();
            const { ethers } = require("hardhat")
            const { getTxUrl } = require('../utils/helper');
            const fetch = require('node-fetch');
            const colors = require('colors');

            //---- Get Ethers Signer-------------------
            const signer0 = ethers.provider.getSigner(deployer);

            //---- Get EMP Contract--------------------
            const { ExpiringMultiPartyEthers__factory } = require('@uma/contracts-node');
            const empInstance = ExpiringMultiPartyEthers__factory.connect(args.empAddress, signer0);

            //----- Fetch Price-------------------------
            const fetchUrl = "http://18.219.111.187/prices.json"

            let price = "";
            try {

                console.log("Fetching Price from Feed: ");

                const responseData = await fetch(fetchUrl)
                    .then((response) => {
                        return response.json();
                    });

                price = responseData[args.priceFeed];
                if (!price || price === "") throw "Fetch Price Feed Empty";
                console.log(args.priceFeed + ": " + price)
            } catch (error) {
                console.log(colors.red("\n Fetch Price Feed Error. Mint EMP Task Failed: ....."));
                console.log(error);
                return;
            }

            //---- Calculations--------------------

            const collateralCurrency = await empInstance.collateralCurrency();
            const syntheticDecimals = await empInstance._getSyntheticDecimals(collateralCurrency);
            const collateralRequirement = ethers.BigNumber.from(await empInstance.collateralRequirement());
            const positions = await empInstance.positions(deployer);
            const tokenOutstanding = positions.tokensOutstanding;
            const collateralDeposited = positions[3]
            const cumulativeFeeMultiplier = ethers.BigNumber.from("1000000000000000000");
            const withdrawalLiveness = await empInstance.withdrawalLiveness();
            const currentTime = Math.floor(Date.now() / 1000);
            const expirationTimestamp = await empInstance.expirationTimestamp();
            const totalPositionCollateral = await empInstance.totalPositionCollateral();

            const totalTokensOutstanding = ethers.BigNumber.from(await empInstance.totalTokensOutstanding());
            const rawGCR = totalTokensOutstanding.isZero() ? ethers.BigNumber.from(0) : (totalPositionCollateral.rawValue).mul(cumulativeFeeMultiplier).div(totalTokensOutstanding);
            const globalCR = (ethers.utils.formatUnits(rawGCR, 18)) / price;
            const withdrawAmount = (args.collateralAmount) * (10 ** 6)

            const updatedCollateral = collateralDeposited - withdrawAmount;
            const calculatedPositionCR = (updatedCollateral / tokenOutstanding) / price;

            console.log("Current Time -> " + currentTime);
            console.log("Expiration Timestamp -> " + expirationTimestamp);
            console.log("Collateral Ratio -> " + ethers.utils.formatEther(collateralRequirement));
            console.log("Withdrawal Liveness -> ", withdrawalLiveness.toNumber())
            console.log("Total Position Collateral ->", ethers.utils.formatEther(collateralReqtotalPositionCollateral.rawValue))
            console.log("Collateral Currency -> " + collateralCurrency);
            console.log("Collateral Decimals -> " + syntheticDecimals);
            console.log("Collateral Deposited -> " + collateralDeposited)
            console.log("Withdraw Amount -> " + args.collateralAmount)
            console.log("Updated Collateral: " + updatedCollateral)
            console.log("Token Outstanding -> " + tokenOutstanding)
            console.log("Global CR(GCR) -> " + globalCR);
            console.log("Calculated  Position CR -> " + calculatedPositionCR)

            if (calculatedPositionCR < ethers.utils.formatEther(collateralRequirement)) {
                console.log("Calculated CR can't be less than the position CR");
                console.log("Position CR " + ethers.utils.formatEther(collateralRequirement) + "  Calculated position cr: " + calculatedPositionCR)

                return
            }
            if (expirationTimestamp < currentTime + withdrawalLiveness) {
                console.log("Not enough time for withdrawal request(Expiration time is very close)...")
                return
            }

            if (positions.withdrawalRequestAmount != 0) {
                console.log("There is an ongoing withdrawal request! Please wait for that to be resulted...")
                return

            }
            const collateralAmountObject = { rawValue: withdrawAmount };

            console.log(colors.blue("\n Requesting Witdrawal: ....."));
            try {
                // const requestWithdrawalTx = await empInstance.requestWithdrawal(collateralAmountObject);
                const receipt = await requestWithdrawalTx.wait();
                console.log("\nTransaction Receipt: \n", receipt)

                const txUrl = getTxUrl(deployments.getNetworkName(), requestWithdrawalTx.hash);
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
