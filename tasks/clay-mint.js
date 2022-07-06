//npx hardhat clay-mint --account <account-address> --amount <amount> --network <network-name>
task("clay-mint", "Mints clay token to the given address")
    .addParam("account", "The account's address")
    .addParam("amount", "The amount to be minted")
    .setAction(
        async (args, deployments,network) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const clayToken = await ethers.getContract("ClayToken", deployer)
            const {getTxUrl} = require('../utils/helper');

            console.log("Clay Contract Address: " + clayToken.address)

            const amount = args.amount
            const beforeBalance = await clayToken.balanceOf(args.account)
            console.log("Minting clay tokens to: " + args.account)
            const tx = await clayToken.mint(args.account, ethers.utils.parseUnits(amount, 'ether'))
            const afterBalance = await clayToken.balanceOf(args.account)
            expect(afterBalance.sub(beforeBalance)).eq(ethers.utils.parseUnits(amount, 'ether'))

            console.log("\nTransaction Receipt: \n",tx)
            console.log(getTxUrl(deployments.network,tx.hash))


        }
    );

module.exports = {};
