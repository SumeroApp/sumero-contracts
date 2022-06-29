// npx hardhat clay-approve --account 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0 --amount 1 --network kovan
// router address: 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0
task("clay-approve", "Approves clay token to given account")
    .addParam("account", "The account's address")
    .addParam("amount", "The amount to be approved")
    .setAction(
        async (args) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();

            const clayToken = await ethers.getContract("ClayToken", deployer);
            const clayBalance = await clayToken.balanceOf(args.account);
            console.log("My account's clay balance is : " + ethers.utils.formatEther(clayBalance));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, 'ether');

            await clayToken.approve(args.account, amountInWei);
            expect(await clayToken.allowance(deployer, args.account)).to.eq(amountInWei);
            console.log("\nCLAY Approved");



        }
    );
