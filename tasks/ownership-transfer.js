// npx hardhat ownership-transfer --target <address> --network <network>

// npx hardhat ownership-transfer --target 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --network dashboard

task("ownership-transfer", "Transfers ownership of contract to multisig address")
.addParam("target", "The address of the target wallet/contract")
.addParam("contract", "The name of the contract")
.setAction(
    async (args, hre) => {
        const { deployer } = await hre.getNamedAccounts();
        const { assert } = require("chai");

        const ownableContract = await ethers.getContract(args.contract, deployer);
        
        const tx = await ownableContract.transferOwnership(args.multisig)
        await tx.wait()

        assert(await ownableContract.owner()).to.be.eq(args.multisig)
  
        console.log(`Transferred ${args.contract}ownership to: ${args.multisig}`);
}
);
