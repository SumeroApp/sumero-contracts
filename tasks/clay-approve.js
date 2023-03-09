// npx hardhat clay-approve --spender <spender-address> --amount <amount> --network <network-name>
task("clay-approve", "Approves clay token to given account")
    .addParam("spender", "The account's address")
    .addParam("amount", "The amount to be approved")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if trasactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');

            if (args.gnosisSafe && !ethers.utils.isAddress(args.gnosisSafe)) throw new Error("Invalid safe address")

            const clayToken = await ethers.getContract("ClayToken", deployer);
            console.log("Using ClayToken: ", clayToken.address);

            const clayBalance = await clayToken.balanceOf(args.gnosisSafe || deployer);
            console.log("My account's clay balance is : " + ethers.utils.formatEther(clayBalance));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, 'ether');

            console.log("Approving CLAY..");

            const { gnosisSafe } = args;
            if (gnosisSafe) {
                const getGnosisSigner = require('../gnosis/signer');
                const tx = await clayToken.connect(await getGnosisSigner(gnosisSafe)).approve(args.spender, amountInWei);
                console.log("Gnosis tx hash: ", tx.hash)
                console.log(`Go to gnosis dashbaord to view/confirm the txn: https://app.safe.global/transactions/queue?safe=${gnosisSafe}`)
                return
            }

            const tx = await clayToken.approve(args.spender, amountInWei);
            await tx.wait();
            expect(await clayToken.allowance(deployer, args.spender)).to.eq(amountInWei);
            console.log("\nCLAY Approved");

            console.log("\nTransaction Receipt: \n", tx)
            const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );
