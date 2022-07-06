//npx hardhat clay-mint --account 0xB957C7591bf8b8ad1e5B8942dE6FF3b1D22d4951 --amount 1.0 --network kovan
task("clay-mint", "Mints clay token to the given address")
    .addParam("account", "The account's address")
    .addParam("amount", "The amount to be minted")
    .setAction(
        async (args) => {
            console.log("Clay Contract Address: "+ clayToken.address) 
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const clayToken = await ethers.getContract("ClayToken", deployer);
            console.log("Minting clay tokens to: " + args.account)
            const amount = args.amount
            const beforeBalance = await clayToken.balanceOf(args.account)
            await clayToken.mint(args.account, ethers.utils.parseUnits(amount, 'ether'))
            const afterBalance = await clayToken.balanceOf(args.account)        
            expect(afterBalance.sub(beforeBalance)).eq(ethers.utils.parseUnits(amount, 'ether'))

           
        }
    );

module.exports = {};
