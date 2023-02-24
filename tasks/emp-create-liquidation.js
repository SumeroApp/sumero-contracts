// npx hardhat create-liquidation --emp <address> --sponsor <address> --network <network-name>

task("emp-create-liquidation", "creates liquidation on sponsor's position")
    .addParam("emp", "Address of EMP contract")
    .addParam("sponsor", "Address of the sponsor")
    .setAction(
        async (args, hre) => {
            const { getTxUrl } = require('../utils/helper');
            const { run } = require('hardhat');
            const colors = require('colors');

            console.log(colors.bold("\n==> Running create-liquidation task..."));

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const emp = await EMP.attach(args.emp);
            const tokensOutstanding = await emp.totalTokensOutstanding();
            const rawCollateral = await emp.totalPositionCollateral()
            const positionTokensOutstanding = (await emp.positions(args.sponsor)).tokensOutstanding.rawValue;
            const ooReward = (await emp.ooReward());
            const GCR = rawCollateral.mul(ethers.BigNumber.from(ethers.utils.parseEther("1"))).div(tokensOutstanding);

            console.log(colors.blue("\n 1- Approving synth tokens: ....."));
            await run("erc20-approve", {
                token: await emp.collateralCurrency(),
                spender: args.emp,
                amount: ooReward.toString(),
            })

            console.log(colors.blue("\n 2- Approving collateral tokens: ....."));
            await run("erc20-approve", {
                token: await emp.tokenCurrency(),
                spender: args.emp,
                amount: positionTokensOutstanding.toString(),
            })


            const currentTimestamp = Date.now() / 1000;
            const expirationTimestamp = Math.floor(currentTimestamp + 300);

            console.log(colors.blue("\n 3- Liquidating the position: ....."));
            try {
                const liquidateTX = await emp.createLiquidation(
                    args.sponsor,
                    { rawValue: "0" },
                    { rawValue: GCR.toString() },
                    { rawValue: positionTokensOutstanding.toString() },
                    expirationTimestamp,
                );
                const liquidateTxURL = getTxUrl(hre.deployments.getNetworkName(), liquidateTX.hash);
                if (liquidateTxURL != null) {
                    console.log(colors.yellow("\n", liquidateTxURL));
                }
                console.log("Creating liquidation completed...")
            } catch (error) {
                console.log("Creating liquidation failed...");
                console.log(error);
            }
        }
    );