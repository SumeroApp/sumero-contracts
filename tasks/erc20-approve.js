// npx hardhat erc20-approve --token <token-address> --spender <spender-address> --amount <amount> --network <network-name>
task("erc20-approve", "Approves ERC20 tokens to the given account")
    .addParam("token", "Token Address")
    .addParam("spender", "The account's address") // Router parameter
    .addParam("amount", "The amount to be approved")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if trasactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            let { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');
            const submitTransactionToGnosisSafe = require("../gnosis/helper");

            const Token = await hre.ethers.getContractFactory('ClayToken');
            const token = await Token.attach(args.token);

            const tokenName = await token.name();
            const tokenDecimals = await token.decimals();

            const tokenBalance = await token.balanceOf(args.gnosisSafe || deployer);

            console.log(`My account's ${tokenName} balance is : ` + ethers.utils.formatUnits(tokenBalance, tokenDecimals));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, tokenDecimals);
            const allowance = await token.allowance(args.gnosisSafe || deployer, args.spender);

            console.log(`Approving ${tokenName} token`);
            if (amountInWei.gt(allowance)) {
                try {
                    if (args.gnosisSafe) return submitTransactionToGnosisSafe(args.gnosisSafe, token, 'approve', args.spender, amountInWei);
                    const tx = await token.approve(args.spender, amountInWei);
                    await tx.wait();
                    const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                    if (txUrl != null) {
                        console.log(txUrl);
                    }

                } catch (error) {
                    console.log(`Approving tokenName} token failed...`);
                    console.log(error);
                }
                console.log(`Approving ${tokenName} token completed...`)
            }
            else {
                console.log(`Approving ${tokenName} token passed...`)
            }

        }
    );
