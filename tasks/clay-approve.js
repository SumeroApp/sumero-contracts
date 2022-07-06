// npx hardhat clay-approve --spender <spender-address> --amount <amount> --network <network-name>
task("clay-approve", "Approves clay token to given account")
    .addParam("spender", "The account's address")
    .addParam("amount", "The amount to be approved")
    .setAction(
        async (args, deployments, network) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();

            const clayToken = await ethers.getContract("ClayToken", deployer);
            const clayBalance = await clayToken.balanceOf(deployer);
            console.log("My account's clay balance is : " + ethers.utils.formatEther(clayBalance));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, 'ether');

            const tx = await clayToken.approve(args.spender, amountInWei);
            const txReceipt = await tx.wait()
            expect(await clayToken.allowance(deployer, args.spender)).to.eq(amountInWei);
            console.log("\nCLAY Approved");


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
