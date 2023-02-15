// npx hardhat create-liquidation --emp-address <address> --sponsor <address> --network <network-name>

task("create-liquidation", "creates liquidation on sponsor's position")
    .addParam("empAddress", "Address of EMP contract")
    .addParam("sponsor", "Address of the sponsor")
    .addParam("exp", "EMP expiry in hour")
    .setAction(
        async (args, hre) => {
            const { getTxUrl } = require('../utils/helper');
            const { run } = require('hardhat');
            const colors = require('colors');

            console.log(colors.bold("\n==> Running create-liquidation task..."));

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const emp = await EMP.attach(args.empAddress);
            let sponsor = args.sponsor
            let tokensOutstanding = await emp.totalTokensOutstanding();
            const rawCollateral = await emp.totalPositionCollateral()
            let positionTokensOutstanding = (await emp.positions(sponsor)).tokensOutstanding.rawValue;

            let GCR = rawCollateral.mul(ethers.BigNumber.from(ethers.utils.parseEther("1"))).div(tokensOutstanding);
            console.log('GCR: ' + GCR)
            console.log('positionTokensOutstanding: ' + positionTokensOutstanding)

            await run("erc20-approve",{
                name: "ClayToken",
                address: await emp.collateralCurrency(),
                spender: args.empAddress,
                amount: (await emp.ooReward()).toString(),
            })

            await run("erc20-approve",{
                name: "ClayToken",
                address: await emp.tokenCurrency(),
                spender: args.empAddress,
                amount: positionTokensOutstanding.toString(),
            })

            const currentTimestamp = Date.now() / 1000;
            const expirationTimestamp = Math.floor(currentTimestamp + (Number(args.exp) * 3600));

            tx = await emp.createLiquidation(
                sponsor,
                { rawValue: "0" },
                { rawValue: GCR.toString() },
                { rawValue: positionTokensOutstanding.toString() },
                expirationTimestamp,
            );
            const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );