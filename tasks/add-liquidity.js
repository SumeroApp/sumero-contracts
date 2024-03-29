// npx hardhat add-liquidity --token1 <token-1-name> --address1 <address> --decimal1 <decimal> --amount1 <token-1-amount> --token2 <token-2-name> --address2 <address> --decimal2 <decimal> --amount2 <token-2-amount> --network <network-name>
// npx hardhat add-liquidity --token1 ClayToken --address1 0xee62a7d7dCa1C7f6647368B8F2148A6E1bcbb728 --decimal1 18 --amount1 1000 --token2 USDCoin --address2 0x07865c6E87B9F70255377e024ace6630C1Eaa37F --decimal2 6 --amount2 10

const colors = require('colors');

task("add-liquidity", "Adds liquidity to the pool.")
    .addParam("token1", "Token 1 Name e.g. USDC")
    .addParam("decimal1", "Token 1 Decimal e.g. 6")
    .addParam("amount1", "Token 1 Amount (in eth)")
    .addParam("address1", "Token 1 Address")
    .addParam("token2", "Token 2 Name e.g. ClayToken")
    .addParam("decimal2", "Token 2 Decimal e.g. 18")
    .addParam("amount2", "Token 2 Amount (in eth)")
    .addParam("address2", "Token 2 Address")
    .setAction(
        async (args, hre) => {
            const { deployer } = await getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');
            const { run } = require('hardhat');

            console.log("Deployer Account: " + deployer)

            // Get Uniswap Router from Network
            const router = await ethers.getContract("UniswapV2Router02", deployer);

            // Get Router Addresses
            console.log("Router Address: " + router.address)
            console.log("\nToken 1 address: " + args.address1);
            console.log("\nToken 2 address: " + args.address2);


            console.log(colors.blue(`\n 1- Approving ${args.token1} tokens: .....`));
            await run("erc20-approve", {
                token: args.address1,
                spender: router.address,
                amount: args.amount1,
            })
            console.log(colors.blue(`\n 2- Approving ${args.token2}  tokens: .....`));
            await run("erc20-approve", {
                token: args.address2,
                spender: router.address,
                amount: args.amount2,
            })

            const amount1InUnits = ethers.utils.parseUnits(args.amount1, args.decimal1);
            const amount2InUnits = ethers.utils.parseUnits(args.amount2, args.decimal2);
            
            console.log(colors.blue("\n 3- Adding liquidity: ....."));

            try {
                //Make sure address `adding liquidity` has balance of both the tokens. Also, should have approved sufficient amount of tokens to the router contract.
                const currentBlock = await ethers.provider.getBlockNumber()
                const block = await ethers.provider.getBlock(currentBlock);
                const timestamp = block.timestamp + 300;

                console.log("Providing Liquidity ..");

                // Provide Liquidity
                const tx = await router.addLiquidity(
                    args.address1,
                    args.address2,
                    amount1InUnits,
                    amount2InUnits,
                    0, //amount1min
                    0, //amount2min
                    deployer,
                    timestamp,
                );
                await tx.wait();

                console.log(colors.blue("\nLiquidity Added to: " + args.token1 + " - " + args.token2 + " pair"));
                // Print transaction details
                console.log("\nTransaction Receipt: \n", tx)
                const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
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