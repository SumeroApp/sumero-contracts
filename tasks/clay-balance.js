//npx hardhat clay-balance --account 0x70acfbe30eb83ddda71da8d55a15a73b994bf456
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
