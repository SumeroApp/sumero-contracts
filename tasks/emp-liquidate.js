//npx hardhat emp-liquidate --emp-address <address> --sponsor-address <address> --network goerli
task("emp-liquidate", "Liquidates EMP position")
    .addParam("empAddress", "Address of EMP contract")
    .addParam("sponsorAddress", "Address of the synthetic token contract")
    .setAction(
        async (args, hre) => {
            const { getTxUrl, MAX_UINT } = require('../utils/helper');
            const colors = require('colors');

            // Getting EMP, Synth & Collateral Contracts
            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const emp = await EMP.attach(args.empAddress);

            const collateralTokenAddress = await emp.collateralCurrency();
            const synthAddress = await emp.tokenCurrency();

            const Synth = await hre.ethers.getContractFactory("contracts/UMA/common/implementation/ExpandedERC20.sol:ExpandedERC20");
            const synth = await Synth.attach(synthAddress);
            
            const Collateral = await hre.ethers.getContractFactory("contracts/test/USDC.sol:USDC");
            const collateral = await Collateral.attach(collateralTokenAddress);

 

            console.log(colors.blue("\n 1- Approving synth tokens: ....."));
            try {
                const approveTX = await synth.approve(args.empAddress, MAX_UINT);
                const approveTxUrl = getTxUrl(hre.deployments.getNetworkName(), approveTX.hash);
                if (approveTxUrl != null) {
                    console.log(colors.yellow("\n", approveTxUrl));
                }
                console.log("Approve completed...")
            } catch (error) {
                console.log("Approving synthetic tokens failed...");
                console.log(error);
            }

            console.log(colors.blue("\n 2- Approving collateral tokens: ....."));
            try {
                const approveTX = await collateral.approve(args.empAddress, MAX_UINT);
                const approveTxUrl = getTxUrl(hre.deployments.getNetworkName(), approveTX.hash);
                if (approveTxUrl != null) {
                    console.log(colors.yellow("\n", approveTxUrl));
                }
                console.log("Approve completed...")
            } catch (error) {
                console.log("Approving collateral tokens failed...");
                console.log(error);
            }

            const tokensOutstanding = await emp.totalTokensOutstanding();
            const rawCollateral = await emp.totalPositionCollateral()
            const positionTokensOutstanding = (await emp.positions(args.sponsorAddress)).tokensOutstanding.rawValue;
            const GCR = rawCollateral.mul(ethers.BigNumber.from(ethers.utils.parseEther("1"))).div(tokensOutstanding);

            const currentTimestamp = Date.now() / 1000;
            const expirationTimestamp = Math.floor(currentTimestamp + 300);

            console.log(colors.blue("\n 3- Liquidating the position: ....."));
            try {
                const liquidateTX = await emp.createLiquidation(
                    args.sponsorAddress,
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