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

            let clayToken = await ethers.getContract("ClayToken", deployer);
            const getGnosisSigner = require('../gnosis/signer');
            if(args.gnosisSafe){
                clayToken = clayToken.connect(await getGnosisSigner(args.gnosisSafe))
            }
            console.log("Using ClayToken: ", clayToken.address);

            const clayBalance = await clayToken.balanceOf(clayToken.signer.address);
            console.log("My account's clay balance is : " + ethers.utils.formatEther(clayBalance));

            //Convert ether  to wei
            const amountInWei = ethers.utils.parseUnits(args.amount, 'ether');

            console.log("Approving CLAY..");

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
