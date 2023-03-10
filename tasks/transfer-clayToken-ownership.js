// npx hardhat transfer-clayToken-ownership --address <address> --role <role> --network dashboard
// npx hardhat transfer-clayToken-ownership --address 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --role DEFAULT_ADMIN_ROLE --network dashboard
// Available Roles: DEFAULT_ADMIN_ROLE / MINTER_ROLE / BURNER_ROLE

task("transfer-clayToken-ownership", "Transfers a defined role of ClayToken contract to the target address")
    .addParam("address", "The address the role is being assigned to")
    .addParam("role", "The role to be assigned to the target address")
    .setAction(
        async (args, hre) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { ethers } = require("hardhat");
            const colors = require('colors');
            console.log(colors.blue(`\nTransfering ClayToken's ownerhship...`));

            const clayToken = await ethers.getContract("ClayToken", deployer);
            console.log("ClayToken Deployer Address: " + deployer)
            console.log("ClayToken Contract Address: " + clayToken.address);

            // transfers role to the target address (DEFAULT_ADMIN_ROLE / MINTER_ROLE BURNER_ROLE)
            const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(args.role));
            const grantAdminTx = await clayToken.grantRole(roleHash, (args.address));
            await grantAdminTx.wait();
            const correctRoleAddress = await clayToken.hasRole(roleHash, (args.address));
            expect(correctRoleAddress).to.be.true;

            console.log(`ContractOwner: Grant ${args.role} to the following address: ${args.address}`);
            console.log("\nTransaction Receipt: \n", grantAdminTx);

            // revoke defined role from the original deployer 
            const revokeAdminTx = await clayToken.renounceRole(roleHash, deployer);
            await revokeAdminTx.wait();
            const correctDeployerRole = await clayToken.hasRole(roleHash, deployer);
            expect(correctDeployerRole).to.be.false;

            console.log(`ContractOwner: Revoke ${args.role} from the deployer address: ${deployer}`);

            console.log(`Transferred ${args.role} to the following address: ${args.address}`);

        }
    );

module.exports = {};