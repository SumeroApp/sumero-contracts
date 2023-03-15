// npx hardhat clay-grant-role --account <account-address> --role <role> --network <network-name>
// available roles:  MINTER_ROLE & BURNER_ROLE
task("clay-grant-role", "Grants role to the given address")
    .addParam("account", "The account address for which role is to be granted")
    .addParam("role", "The role to be assigned")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if trasactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { ethers } = require("hardhat");
            const { getTxUrl } = require('../utils/helper');

            let clayToken = await ethers.getContract("ClayToken", deployer);
            console.log("Clay Contract Address: " + clayToken.address);

            const getGnosisSigner = require('../gnosis/signer');
            if(args.gnosisSafe){
                clayToken = clayToken.connect(await getGnosisSigner(args.gnosisSafe))
            }

            const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(args.role));

            const tx = await clayToken.grantRole(roleHash, args.account);
            await tx.wait();

            expect(await clayToken.hasRole(roleHash, args.account)).eq(true);

            console.log("\nTransaction Receipt: \n", tx);
            const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
        }
    );

module.exports = {};
