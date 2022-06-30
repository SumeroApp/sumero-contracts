// npx hardhat erc20-approve --name USDC --address 0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115 --account 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0 --amount 1 --network kovan
// router address: 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0
task("erc20-approve", "Approves ERC20 tokens to the given account")
    .addParam("name", "Token name")
    .addParam("address", "Token Address")
    .addParam("account", "The account's address") // Router parameter
    .addParam("amount", "The amount to be approved")
    .setAction(
        async (args) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();

            const Token = await hre.ethers.getContractFactory(args.name)
            const token = await Token.attach(args.address)

            const tokenName = await token.name()
            expect(tokenName).to.eq(args.name);
            // to get USDC with ETH 
            // await token.deposit({ value: ethers.utils.parseEther(args.amount) })

            const tokenBalance = await token.balanceOf(deployer);
            console.log("My account's balance is : " + ethers.utils.formatEther(tokenBalance));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, 'ether');

            await token.approve(args.account, amountInWei);
            expect(await token.allowance(deployer, args.account)).to.eq(amountInWei);
            console.log(tokenName + " Approved");



        }
    );
