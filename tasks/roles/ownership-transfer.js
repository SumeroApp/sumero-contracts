// npx hardhat ownership-transfer --target <address> --network <network>

// npx hardhat ownership-transfer --target 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --network dashboard

task("ownership-transfer", "Transfers ownership of contract to multisig address")
.addParam("address", "The address of the target wallet/contract")
.addParam("contract", "The name of the contract")
.setAction(
    async (args, hre) => {
        const colors = require('colors');
        console.log(colors.blue(`\nTransfering ${args.contract}'s ownerhship...`));

        const { deployer } = await hre.getNamedAccounts();
        const { expect } = require('chai');

        const ownableContract = await ethers.getContract(args.contract, deployer);
        
        const tx = await ownableContract.transferOwnership(args.address)
        await tx.wait()

        expect(await ownableContract.owner()).to.be.eq(args.address , "Something went wrong while transfering ownership...")
  
        console.log(`Transferred ${args.contract}'s ownership to: ${args.address}`);
}
);
