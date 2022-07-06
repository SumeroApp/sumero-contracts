// npx hardhat erc20-approve --name <deployed-token-name> --address <token-address> --spender <spender-address> --amount <amount> --network <network-name>
task("erc20-approve", "Approves ERC20 tokens to the given account")
    .addParam("name", "Token name")
    .addParam("address", "Token Address")
    .addParam("spender", "The account's address") // Router parameter
    .addParam("amount", "The amount to be approved")
    .setAction(
        async (args, deployments, network) => {
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

            const tx = await token.approve(args.spender, amountInWei);
            const txReceipt = await tx.wait()

            expect(await token.allowance(deployer, args.spender)).to.eq(amountInWei);
            console.log(tokenName + " Approved");

            // Get transaction details
            const networkName = deployments.network.name
            let txLink;
            if (network != "hardhat") {
                txLink = "https://" + networkName + ".etherscan.io/tx/" + tx.hash
            }
            console.log(txReceipt)
            console.log("Transaction Link: " + txLink)


        }
    );
