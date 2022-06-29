// Before running this task approve operations must be done!
// Approve CLAY:  npx hardhat clay-approve --account 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0 --amount 1 --network kovan
// Approve ERC20: npx hardhat erc20-approve --name USDC --address 0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115 --account 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0 --amount 1 --network kovan
// Add Liquidity: npx hardhat add-liq --first ClayToken --amount1 1 --second USDC --amount2 1 --network kovan

const { deploy } = require('hardhat-deploy');
const { expect } = require('chai');
const colors = require('colors');

task("add-liq", "Adds liquidity to the pool.")
    .addParam("first", "Token A Name(CLAY)")
    .addParam("amount1", "Token A Amount(Ether)")
    .addParam("second", "Token B Name(USDC)")
    .addParam("amount2", "Token B Amount(Ether)")
    .setAction(
        async (args, hre) => {
            const { deployer } = await getNamedAccounts();
            console.log("Deployer Account: " + deployer)

            // Get Clay Token contract from Kovan
            const assetFirst = await ethers.getContract(args.first, deployer);
            // Get USDC contract from Kovan            
            const assetSecond = await ethers.getContract(args.second, deployer);
            // Get Uniswap Router  from Kovan
            const router = await ethers.getContract("UniswapV2Router02", deployer);

            // Get Router Addresses
            console.log("Router Address: " + router.address)

            // Get decimals
            const decimalFirst = await assetFirst.decimals()
            console.log(args.assetFirst + " decimal: " + decimalFirst)
            const decimalSecond = await assetSecond.decimals()
            console.log(args.assetSecond + " decimal: " + decimalSecond)

            // 1 USDC => 100 CLAY
            const one_clay = 1 * (10 ** decimalFirst);
            console.log(one_clay);
            const one_usdc = 1 * (10 ** decimalSecond);
            console.log(one_usdc);

            try {
                //Make sure address `adding liquidty` has balance of both the tokens.Also, should have approved sufficient amount of tokens to the router contract.
                const currentBlock = await ethers.provider.getBlockNumber()
                const block = await ethers.provider.getBlock(currentBlock);
                const timestamp = block.timestamp + 300;

                // Provide Liquidity
                await router.addLiquidity(
                    assetSecond.address,
                    assetFirst.address,
                    (args.amount2 * one_usdc).toString(), //USDC
                    (args.amount1 * one_clay).toString(), //CLAY
                    0,
                    0,
                    deployer,
                    timestamp
                )
                console.log(colors.blue("\nLiquidity Added to USDC-CLAY Pair"));

            } catch (error) {
                console.log(colors.red("Issue when adding liquidity to USDC-CLAY Pair"));
                console.log(colors.red(error));
            }
        }
    );

module.exports = {};