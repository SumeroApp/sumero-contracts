//npx hardhat add-liq --network kovan
const { deploy } = require('hardhat-deploy');
const { expect } = require('chai');
const colors = require('colors');

task("add-liq", "Adds liquidity to the pool.")
    .setAction(
        async (hre) => {
            const { deployer } = await getNamedAccounts();
            console.log("Deployer Account: " + deployer)
            // Get Clay Token contract from Kovan
            const ClayToken = await hre.ethers.getContractFactory('ClayToken')
            const clayToken = await ClayToken.attach("0x3f6fd91d42fc0070122435cfcF6EeA33804f280d")

            // Get USDC contract from Kovan
            const USDC = await ethers.getContractFactory("USDC");
            const usdc = await USDC.attach("0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115")

            // Get Uniswap Factory from Kovan
            const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
            const UniswapFactoryDeployed = await UniswapV2Factory.attach("0xc88D40380C75231862776C61f67a77030A64946e")
            console.log("UniswapFactoryDeployed: " + UniswapFactoryDeployed.address)

            // Get Uniswap Router  from Kovan
            const UniswapRouter = await ethers.getContractFactory("UniswapV2Router02");
            const router = await UniswapRouter.attach("0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0")
            console.log("router: " + router.address)

            // mint 100 clay token to deployer
            await clayToken.mint(deployer, ethers.utils.parseUnits("100.0", 'ether'))
            console.log("Account's usdt balance: " + await usdc.balanceOf(deployer))
            console.log("Account's usdt balance: " + await clayToken.balanceOf(deployer))

            try {

                //Make sure address `adding liquidty` has balance of both the tokens.Also, should have approved sufficient amount of tokens to the router contract.
                const currentBlock = await ethers.provider.getBlockNumber()
                const block = await ethers.provider.getBlock(currentBlock);
                const timestamp = block.timestamp + 300;

                await usdc.approve(router.address, ethers.utils.parseEther('2000'));
                expect(await usdc.allowance(deployer, router.address)).to.eq(ethers.utils.parseEther('2000'), "Router doesn't have permission to spend owner's USDC");
                console.log(colors.blue("\nUSDC Approved"));

                await clayToken.approve(router.address, ethers.utils.parseEther('2000'));
                expect(await clayToken.allowance(deployer, router.address)).to.eq(ethers.utils.parseEther('2000'), "Router doesn't have permission to spend owner's CLAY");
                console.log(colors.blue("\nCLAY Approved"));

                // Provide Liquidity
                // 1 USDC => 100 CLAY
                const one_usdc = 1 * (10 ** 6);
                console.log(one_usdc);
                const one_clay = 1 * (10 ** 18);
                console.log(one_clay);

                await router.addLiquidity(
                    usdc.address,
                    clayToken.address,
                    one_usdc.toString(),
                    (10 * one_clay).toString(),
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
