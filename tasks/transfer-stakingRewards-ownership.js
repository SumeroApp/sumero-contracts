// npx hardhat transfer-stakingRewards-ownership --target <address> --network <network>

// npx hardhat transfer-stakingRewards-ownership --target 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --network dashboard

task("transfer-stakingRewards-ownership", "Transfers ownership of contract to multisig address")
.addParam("target", "The address of the target wallet/contract")
.setAction(
    async (args, hre) => {
        const { deployer } = await hre.getNamedAccounts();
        const { assert } = require("chai");

        const clayStakingRewards = await ethers.getContract("ClayStakingRewards", deployer);
        
        const tx = await clayStakingRewards.transferOwnership(args.multisig)
        await tx.wait()

        assert(await clayStakingRewards.owner()).to.be.eq(args.multisig)
  
        console.log("Transferred ownership to:", args.multisig);
}
);
