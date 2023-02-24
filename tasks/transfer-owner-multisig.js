// npx hardhat transfer-owner-multisig --contractAddress <address> --multisigAddress <address> --network dashboard

task("transfer-owner-multisig", "Transfers ownership of contract to multisig address")
.addParam("contractAddress", "Address of deployed contract")
.addParam("multisigAddress", "Address of the multisig contract")
.setAction(
    async (args, hre) => {
        const { deployer } = await hre.getNamedAccounts();

        const Contract = await hre.ethers.getContractFactory("contracts/ClayToken.sol:ClayToken");
        const contract = await Contract.deployed(args.contractAddress);
  
        // grant multisig DEFAULT_ADMIN_ROLE
        const grantAdminTx = await contract.grantRole(DEFAULT_ADMIN_ROLE, args.multisigAddress);
        await grantAdminTx.wait();
        const correctMultisigRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, args.multisigAddress);
        expect(correctMultisigRole).to.be.true;
  
        console.log(`ContractOwner: Grant DEFAULT_ADMIN_ROLE to multisig: ${args.multisigAddress}`);
  
         // revoke deployer DEFAULT_ADMIN_ROLE
        const revokeAdminTx = await contract.renounceRole(DEFAULT_ADMIN_ROLE, deployer);
        await revokeAdminTx.wait();
        const correctDeployerRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer);
        expect(correctDeployerRole).to.be.false;
  
        console.log(`ContractOwner: Revoke DEFAULT_ADMIN_ROLE from deployer: ${deployer}`);
  
        console.log("Transferred ownership to:", args.multisigAddress);
}
);
