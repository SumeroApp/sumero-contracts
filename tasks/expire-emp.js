// npx hardhat expire-emp --address 0xF7b20AD6239133B71878f6AA885123095F47026b --network kovan
// before expiry contract state is 0

const { provider } = require('ganache');

// after expiry contract state is 1
task("expire-emp", "Expires emps")
    .addParam("address", "Emp Address")
    .setAction(
        async (args, deployments, network) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const emp = await EMP.attach(args.address);
            console.log("\n Expriring EMP: .....");
            try {
                console.log("Contract State: " + await emp.contractState())
                const expireEmpTx = await emp.expire()
                await expireEmpTx.wait();
                const txUrl = getTxUrl(deployments.network, expireEmpTx.hash);
                if (txUrl != null) {
                    console.log(txUrl);
                }

            } catch (error) {
                console.log("expireEmpTx failed!");
                console.log(error);
            }

        }
    );
