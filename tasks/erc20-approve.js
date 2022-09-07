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
            const { getTxUrl } = require('../utils/helper');

            const Token = await hre.ethers.getContractFactory(args.name);
            const token = await Token.attach(args.address);

            const tokenName = await token.name();
            const tokenDecimals = await token.decimals();
            // expect(tokenName).to.eq(args.name);

            // to get USDC with ETH 
            // await token.deposit({ value: ethers.utils.parseEther(args.amount) })

            const tokenBalance = await token.balanceOf(deployer);
            console.log("My account's balance is : " + ethers.utils.formatUnits(tokenBalance, tokenDecimals));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, 'ether');

            console.log("Approving ERC20 token ", tokenName);
            const tx = await token.approve(args.spender, amountInWei);
            await tx.wait();

            expect(await token.allowance(deployer, args.spender)).to.eq(amountInWei);
            console.log(tokenName + " Approved");

            console.log("\nTransaction Receipt: \n", tx)
            const txUrl = getTxUrl(deployments.network, tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );
