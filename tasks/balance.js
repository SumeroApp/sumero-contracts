//npx hardhat balance --account 0x70acfbe30eb83ddda71da8d55a15a73b994bf456
task("balance", "Prints an account's balance")
    .addParam("account", "The account's address")
    .setAction(
        async (args) => {
            const ClayToken = await hre.ethers.getContractFactory('ClayToken')
            const clayToken = await ClayToken.attach("0x3f6fd91d42fc0070122435cfcF6EeA33804f280d")
            const clayBalance = await clayToken.balanceOf(args.account)
            console.log("My account's clay balance is : " + ethers.utils.formatEther(clayBalance))
        }
    );

module.exports = {};
