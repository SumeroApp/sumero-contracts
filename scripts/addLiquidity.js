// Scripts to work on

// ==> Show CLAY Balance

// ==> Mint CLAY to a address
// const clayToken = await ethers.getContract("ClayToken", deployer);

// if (isLocalNetwork() && !isForkedNetwork()) {
//     console.log(colors.blue("\nMinting Clay Token.."));
//     // test
//     // mint CLAY token to accounts[0]
//     await clayToken.mint(deployer, ethers.utils.parseEther('800000'));
//     const clayTokenBalance = (await clayToken.balanceOf(deployer)).toString();

//     expect(ethers.utils.formatEther(clayTokenBalance)).to.equal('800000.0', "Clay Token Balance doesn't match");

//     // mint CLAY token to metamask wallet address
//     await clayToken.mint(sumeroTestUser, ethers.utils.parseEther('800000'));
//     const metamaskAddressBalance = (await clayToken.balanceOf(sumeroTestUser)).toString();

//     expect(ethers.utils.formatEther(metamaskAddressBalance)).to.equal('800000.0', "Clay Token Balance doesn't match");
// }

// ==> Add Liquidty
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