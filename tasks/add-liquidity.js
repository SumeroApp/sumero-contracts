// Before running this task approve operations must be done!
// Approve CLAY:  npx hardhat clay-approve --spender <spender-address> --amount <amount> --network <network-name>
// Approve ERC20: npx hardhat erc20-approve --name <deployed-token-name> --address <token-address> --spender <spender-address> --amount <amount> --network <network-name>
// Add Liquidity: npx hardhat add-liquidity --token1 <token-1-name> --amount1 <token-1-amount> --token2 <token-2-name> --amount2 <token-2-amount> --network <network-name>

const colors = require('colors');

task("add-liquidity", "Adds liquidity to the pool.")
    .addParam("token1", "Token 1 Name e.g. USDC")
    .addParam("amount1", "Token 1 Amount (in eth)")
    .addParam("token2", "Token 2 Name e.g. ClayToken")
    .addParam("amount2", "Token 2 Amount (in eth)")
    .setAction(
        async (args, deployments) => {
            const { deployer } = await getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');

            console.log("Deployer Account: " + deployer)

            // Get First Token from Network
            const assetFirst = await ethers.getContract(args.token1, deployer);
            //  Get Second Token from Network           
            const assetSecond = await ethers.getContract(args.token2, deployer);
            // Get Uniswap Router from Network
            const router = await ethers.getContract("UniswapV2Router02", deployer);

            // Get Router Addresses
            console.log("Router Address: " + router.address)

            // Get decimals
            const decimalFirst = await assetFirst.decimals()
            console.log(args.token1 + " has " + decimalFirst + " decimals")
            const decimalSecond = await assetSecond.decimals()
            console.log(args.token2 + " has  " + decimalSecond + " decimals")

            // e.g 1 ether =  1 * (10 ** 18)
            const assetFirstInUnit = 1 * (10 ** decimalFirst);
            console.log(assetFirstInUnit);
            const assetSecondinUnit = 1 * (10 ** decimalSecond);
            console.log(assetSecondinUnit);

            try {
                //Make sure address `adding liquidity` has balance of both the tokens. Also, should have approved sufficient amount of tokens to the router contract.
                const currentBlock = await ethers.provider.getBlockNumber()
                const block = await ethers.provider.getBlock(currentBlock);
                const timestamp = block.timestamp + 300;

                // Provide Liquidity
                const tx = await router.addLiquidity(
                    assetSecond.address,
                    assetFirst.address,
                    (args.amount2 * assetFirstInUnit).toString(),
                    (args.amount1 * assetSecondinUnit).toString(),
                    0,
                    0,
                    deployer,
                    timestamp
                )
                console.log(colors.blue("\nLiquidity Added to: " + args.token1 + " - " + args.token2 + " pair"));
                // Print transaction details
                console.log("\nTransaction Receipt: \n", tx)
                const txUrl = getTxUrl(deployments.network, tx.hash);
                if (txUrl != null) {
                    console.log(txUrl);
                }

            } catch (error) {
                console.log(colors.blue("\nIssue when adding liquidity to : " + args.token1 + " - " + args.token2 + " pair"));
                console.log(colors.red(error));
            }
        }
    );

module.exports = {};