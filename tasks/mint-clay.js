//npx hardhat mint-clay --account 0xB957C7591bf8b8ad1e5B8942dE6FF3b1D22d4951 --amount 1.0 --network kovan
task("mint-clay", "Mints clay token to the given address")
    .addParam("account", "The account's address")
    .addParam("amount", "The amount to be minted")
    .setAction(
        async (args) => {
            const { expect } = require('chai');
            accounts = await ethers.getSigners()

            const ClayToken = await hre.ethers.getContractFactory('ClayToken')
            const clayToken = await ClayToken.attach("0x3f6fd91d42fc0070122435cfcF6EeA33804f280d")
            console.log("Minting clay tokens to: " + args.account)
            const amount = args.amount
            const beforeBalance = await clayToken.balanceOf(args.account)
            await clayToken.mint(args.account, ethers.utils.parseUnits(amount, 'ether'))
            const afterBalance = await clayToken.balanceOf(args.account)        
            expect(afterBalance.sub(beforeBalance)).eq(ethers.utils.parseUnits(amount, 'ether'))
        }
    );

module.exports = {};
