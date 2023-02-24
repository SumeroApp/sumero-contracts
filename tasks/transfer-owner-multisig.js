// npx hardhat transfer-owner-multisig --contract <address> --multisig <address> --network dashboard

// npx hardhat transfer-owner-multisig --multisig 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --contract 0xDA18Ac17C5789D94030a99E5347db2b0F2de355F --network dashboard

task("transfer-owner-multisig", "Transfers ownership of contract to multisig address")
.addParam("multisig", "The address of the multisig wallet")
.addParam("contract", "The address of the deployed contract")
.setAction(
    async (args, hre) => {
        const { deployer } = await hre.getNamedAccounts();

        const Contract = await ethers.getContractFactory("contracts/ClayToken.sol:ClayToken");
        const contract = await Contract.deploy();
  
        // grant multisig DEFAULT_ADMIN_ROLE
        const grantAdminTx = await contract.grantRole(DEFAULT_ADMIN_ROLE, multisig);
        await grantAdminTx.wait();
        const correctMultisigRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, multisig);
        expect(correctMultisigRole).to.be.true;
  
        console.log(`ContractOwner: Grant DEFAULT_ADMIN_ROLE to multisig: ${multisig}`);
  
         // revoke deployer DEFAULT_ADMIN_ROLE
        const revokeAdminTx = await contract.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
        await revokeAdminTx.wait();
        const correctDeployerRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer);
        expect(correctDeployerRole).to.be.false;
  
        console.log(`ContractOwner: Revoke DEFAULT_ADMIN_ROLE from deployer: ${deployer}`);
  
        console.log("Transferred ownership to:", multisig);
}
);
