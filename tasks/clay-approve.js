// npx hardhat clay-approve --spender <spender-address> --amount <amount> --network <network-name>
task("clay-approve", "Approves clay token to given account")
    .addParam("spender", "The account's address")
    .addParam("amount", "The amount to be approved")
    .setAction(
        async (args, deployments) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');

            const clayToken = await ethers.getContract("ClayToken", deployer);
            console.log("Using ClayToken: ", clayToken.address);

            const clayBalance = await clayToken.balanceOf(deployer);
            console.log("My account's clay balance is : " + ethers.utils.formatEther(clayBalance));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, 'ether');

            console.log("Approving CLAY..");
            const tx = await clayToken.approve(args.spender, amountInWei);
            await tx.wait();
            expect(await clayToken.allowance(deployer, args.spender)).to.eq(amountInWei);
            console.log("\nCLAY Approved");

            console.log("\nTransaction Receipt: \n", tx)
            const txUrl = getTxUrl(deployments.getNetworkName(), tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );
