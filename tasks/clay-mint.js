//npx hardhat clay-mint --account <account-address> --amount <amount> --network <network-name>
task("clay-mint", "Mints clay token to the given address")
    .addParam("account", "The account's address")
    .addParam("amount", "The amount to be minted")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if trasactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const clayToken = await ethers.getContract("ClayToken", deployer);
            const { getTxUrl } = require('../utils/helper');
            const submitTransactionToGnosisSafe = require("../gnosis/helper");
            
            console.log("Clay Contract Address: " + clayToken.address);

            const amount = args.amount;
            const beforeBalance = await clayToken.balanceOf(args.account);
            console.log("Minting clay tokens to: " + args.account);

            
            if (args.gnosisSafe) return submitTransactionToGnosisSafe(args.gnosisSafe, clayToken, 'mint', args.account, ethers.utils.parseUnits(amount, 'ether'));
            const tx = await clayToken.mint(args.account, ethers.utils.parseUnits(amount, 'ether'));
            await tx.wait();
            const afterBalance = await clayToken.balanceOf(args.account);
            expect(afterBalance.sub(beforeBalance)).eq(ethers.utils.parseUnits(amount, 'ether'));

            console.log("\nTransaction Receipt: \n", tx);
            const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );

module.exports = {};
