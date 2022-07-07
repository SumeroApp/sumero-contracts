// npx hardhat clay-get-allowance --owner <owner-address> --spender <spender-address> --network kovan
task("clay-get-allowance", "Get's allowance of owner's clay token for spender account")
    .addParam("owner", "The owner's address")
    .addParam("spender", "The spender's address")
    .setAction(
        async (args) => {
            const { deployer } = await hre.getNamedAccounts();

            const clayToken = await ethers.getContract("ClayToken", deployer);
            const allowance = await clayToken.allowance(args.owner, args.spender);
            console.log("Allowance of owner's CLAY for spender is : " + ethers.utils.formatEther(allowance));
        }
    );
