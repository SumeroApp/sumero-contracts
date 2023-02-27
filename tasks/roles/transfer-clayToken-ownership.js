// npx hardhat transfer-clayToken-ownership --address <address> --role <role> --network dashboard

// npx hardhat transfer-clayToken-ownership --address 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --role DEFAULT-ADMIN-ROLE --network dashboard

task("transfer-clayToken-ownership", "Transfers ownership of contract to multisig address")
.addParam("address", "The address of the new ownership wallet")
.addParam("role", "The role to be assigned to the new wallet address")
.setAction(
    async (args, hre) => {
        const { expect } = require('chai');
        const { deployer } = await hre.getNamedAccounts();
        const { ethers } = require("hardhat");
        const colors = require('colors');
        console.log(colors.blue(`\nTransfering ClayToken's ownerhship...`));

        const account = args.address
        const clayToken = await ethers.getContract("ClayToken", deployer);
        console.log("Deployer Account: " + deployer)
        console.log("Clay Contract Address: " + clayToken.address);
        //const contract = await Contract.deployed();
  
        // grant multisig DEFAULT_ADMIN_ROLE
        const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(args.role));
        const grantAdminTx = await clayToken.grantRole(roleHash, (account));
        await grantAdminTx.wait();
        const correctMultisigRole = await clayToken.hasRole(roleHash, (account));
        expect(correctMultisigRole).to.be.true;
  
        console.log(`ContractOwner: Grant MINTER_ROLE to multisig: ${account}`);
        console.log("\nTransaction Receipt: \n", grantAdminTx);
  
         // revoke deployer DEFAULT_ADMIN_ROLE
        const revokeAdminTx = await clayToken.renounceRole(roleHash, deployer);
        await revokeAdminTx.wait();
        const correctDeployerRole = await clayToken.hasRole(roleHash, deployer);
        expect(correctDeployerRole).to.be.false;
  
        console.log(`ContractOwner: Revoke MINTER_ROLE from deployer: ${deployer}`);
  
        console.log(`Transferred ownership to: ${account}`);

}
);

module.exports = {};