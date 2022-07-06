// Before running this task approve operations must be done!
// Approve CLAY:  npx hardhat clay-approve --spender <spender-address> --amount <amount> --network <network-name>
// Approve ERC20: npx hardhat erc20-approve --name <deployed-token-name> --address <token-address> --spender <spender-address> --amount <amount> --network <network-name>
// Add Liquidity: npx hardhat add-liq --first <token-1> --amount1 <token-1-amount> --second <token-2> --amount2 <token-2-amount> --network <network-name>

const { deploy } = require('hardhat-deploy');
const { expect } = require('chai');
const colors = require('colors');

task("add-liq", "Adds liquidity to the pool.")
    .addParam("first", "Token A Name")
    .addParam("amount1", "Token A Amount(in eth)")
    .addParam("second", "Token B Name")
    .addParam("amount2", "Token B Amount(in eth)")
    .setAction(
        async (args, deployments, network) => {
            const { deployer } = await getNamedAccounts();
            const {getTxUrl} = require('../utils/helper');

            console.log("Deployer Account: " + deployer)

            // Get First Token from Kovan
            const assetFirst = await ethers.getContract(args.first, deployer);
            //  Get Second Token from Kovan           
            const assetSecond = await ethers.getContract(args.second, deployer);
            // Get Uniswap Router from Kovan
            const router = await ethers.getContract("UniswapV2Router02", deployer);

            // Get Router Addresses
            console.log("Router Address: " + router.address)

            // Get decimals
            const decimalFirst = await assetFirst.decimals()
            console.log(args.first + " has " + decimalFirst + " decimals")
            const decimalSecond = await assetSecond.decimals()
            console.log(args.second + " has  " + decimalSecond + " decimals")

            // e.g 1 ether =  1 * (10 ** 18)
            const one_assetFirst = 1 * (10 ** decimalFirst);
            console.log(one_assetFirst);
            const one_assetSecond = 1 * (10 ** decimalSecond);
            console.log(one_assetSecond);

            try {
                //Make sure address `adding liquidty` has balance of both the tokens. Also, should have approved sufficient amount of tokens to the router contract.
                const currentBlock = await ethers.provider.getBlockNumber()
                const block = await ethers.provider.getBlock(currentBlock);
                const timestamp = block.timestamp + 300;

                // Provide Liquidity
                const tx = await router.addLiquidity(
                    assetSecond.address,
                    assetFirst.address,
                    (args.amount2 * one_assetSecond).toString(),
                    (args.amount1 * one_assetFirst).toString(),
                    0,
                    0,
                    deployer,
                    timestamp
                )
                console.log(colors.blue("\nLiquidity Added to: " + args.first + " - " + args.second + " pair"));
                // Print transaction details
                console.log("\nTransaction Receipt: \n",tx)
                console.log(getTxUrl(deployments.network,tx.hash))

            } catch (error) {
                console.log(colors.blue("\nIssue when adding liquidity to : " + args.first + " - " + args.second + " pair"));
                console.log(colors.red(error));
            }
        }
    );

module.exports = {};