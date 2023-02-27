// npx hardhat transfer-owner-multisig --account <address> --role <role> --network dashboard

// npx hardhat transfer-owner-multisig --account 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --role DEFAULT-ADMIN-ROLE --network dashboard

task("transfer-owner-multisig", "Transfers ownership of contract to multisig address")
.addParam("account", "The address of the new ownership wallet")
.addParam("role", "The role to be assigned to the new wallet address")
.setAction(
    async (args, hre) => {
        const { expect } = require('chai');
        const { deployer } = await hre.getNamedAccounts();
        const { ethers } = require("hardhat");

        const account = args.account
        const Contract = await ethers.getContract("ClayToken", deployer);
        console.log("Deployer Account: " + deployer)
        console.log("Clay Contract Address: " + Contract.address);
        //const contract = await Contract.deployed();
  
        // grant multisig DEFAULT_ADMIN_ROLE
        const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(args.role));
        const grantAdminTx = await Contract.grantRole(roleHash, (args.account));
        await grantAdminTx.wait();
        const correctMultisigRole = await Contract.hasRole(roleHash, (args.account));
        expect(correctMultisigRole).to.be.true;
  
        console.log(`ContractOwner: Grant MINTER_ROLE to multisig: ${account}`);
        console.log("\nTransaction Receipt: \n", grantAdminTx);
  
         // revoke deployer DEFAULT_ADMIN_ROLE
        const revokeAdminTx = await Contract.renounceRole(roleHash, deployer);
        await revokeAdminTx.wait();
        const correctDeployerRole = await Contract.hasRole(roleHash, deployer);
        expect(correctDeployerRole).to.be.false;
  
        console.log(`ContractOwner: Revoke MINTER_ROLE from deployer: ${deployer}`);
  
        console.log(`Transferred ownership to: ${account}`);

}
);

module.exports = {};