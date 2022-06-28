// TODO: Seperate out individual actions to perform into seperate HRE scripts that can be run and controlled via a central script.
const hre = require("hardhat");

async function main() {

    USDCDeployed = {
        address: '0xc2569dd7d0fd715b054fbf16e75b001e5c0c1115'
    };

    clayToken = {
        address: '0x64C597aBf737Ec2551dfbd3c492dA7da1Bf06a98'
    };

    const { deployer } = await hre.getNamedAccounts();
    const router = await ethers.getContract("UniswapV2Router02", deployer);

    const one_usdc = 1 * (10 ** 6);
    // 1000000
    // 1000000000000000000
    console.log(one_usdc);
    const one_clay = 1 * (10 ** 18);
    console.log(one_clay);

    await router.addLiquidity(
        USDCDeployed.address,
        clayToken.address,
        1000 * one_usdc.toString(),
        (10 * one_clay).toString(),
        0,
        0,
        deployer,
        timestamp
    )
    console.log(colors.blue("\nLiquidity Added to USDC-CLAY Pair"));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

        // TODO: Do this from addLiqudity script (in progress)
    // Add Liquidty to USDC-CLAY Pair
    // try {
        // Make sure address `adding liquidty` has balance of both the tokens. Also, should have approved sufficient amount of tokens to the router contract.
        // const currentBlock = await ethers.provider.getBlockNumber()
        // const block = await ethers.provider.getBlock(currentBlock);
        // const timestamp = block.timestamp + 300;

        // if (isLocalNetwork() && !isForkedNetwork()) {
        //     await usdc.approve(router.address, ethers.utils.parseEther('2000'));
        //     expect(await usdc.allowance(deployer, router.address)).to.equal(ethers.utils.parseEther('2000'), "Router doesn't have permission to spend owner's USDC");
        //     console.log(colors.blue("\nUSDC Approved"));

        //     await clayToken.approve(router.address, ethers.utils.parseEther('2000'));
        //     expect(await clayToken.allowance(deployer, router.address)).to.equal(ethers.utils.parseEther('2000'), "Router doesn't have permission to spend owner's CLAY");
        //     console.log(colors.blue("\nCLAY Approved"));


        //     // Provide Liquidity
        //     // 1 USDC => 100 CLAY
        //     const one_usdc = 1 * (10 ** 6);
        //     console.log(one_usdc);
        //     const one_clay = 1 * (10 ** 18);
        //     console.log(one_clay);

        //     await router.addLiquidity(
        //         USDCDeployed.address,
        //         clayToken.address,
        //         one_usdc.toString(),
        //         (10 * one_clay).toString(),
        //         0,
        //         0,
        //         deployer,
        //         timestamp
        //     )
        //     console.log(colors.blue("\nLiquidity Added to USDC-CLAY Pair"));
        // }
        // else provide liquidity manually in a live network


    // } catch (error) {
    //     console.log(colors.red("Issue when adding liquidity to USDC-CLAY Pair"));
    //     console.log(colors.red(error));
    // }