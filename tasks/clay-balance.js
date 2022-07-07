// npx hardhat clay-balance --account <account-address>
task("clay-balance", "Prints an account's balance")
    .addParam("account", "The account's address")
    .setAction(
        async (args) => {
            const { deployer } = await hre.getNamedAccounts();

            const clayToken = await ethers.getContract("ClayToken", deployer);
            const clayBalance = await clayToken.balanceOf(args.account);
            console.log("My account's clay balance is : " + ethers.utils.formatEther(clayBalance));
        }
    );
