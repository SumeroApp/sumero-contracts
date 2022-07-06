// npx hardhat clay-grant-role --account <account-address> --role <role> --network <network-name>
// available roles:  MINTER_ROLE & BURNER_ROLE
task("clay-grant-role", "Grants role to the given address")
    .addParam("account", "The account's address")
    .addParam("role", "The role to be assigned")
    .setAction(
        async (args, deployments, network) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { ethers } = require("hardhat")
            const {getTxUrl} = require('../utils/helper');

            const clayToken = await ethers.getContract("ClayToken", deployer)
            console.log("Clay Contract Address: " + clayToken.address)

            const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(args.role))
            console.log("MINTER_ROLE" + await clayToken.MINTER_ROLE)
            const tx = await clayToken.grantRole(roleHash, args.account)
            
            expect(await clayToken.hasRole(roleHash, StakingRewardsAddress)).eq(true)

            console.log("\nTransaction Receipt: \n",tx)
            console.log(getTxUrl(deployments.network,tx.hash))

        }
    );

module.exports = {};
