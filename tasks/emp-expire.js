
// npx hardhat emp-expire --address <address> --network <network-name>

task("emp-expire", "Expires EMPs")
    .addParam("address", "Address of EMP to expire")
    .setAction(
        async (args, deployments) => {
            const { expect } = require('chai');
            const { getTxUrl } = require('../utils/helper');
            const colors = require('colors');

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const emp = await EMP.attach(args.address);
            console.log(colors.blue("\n Expiring EMP: ....."));
            try {
                expect(await emp.contractState()).to.eq(0);
                const expireEmpTx = await emp.expire()
                await expireEmpTx.wait();
                expect(await emp.contractState()).to.eq(1);
                const txUrl = getTxUrl(hre.deployments.getNetworkName(), expireEmpTx.hash);
                if (txUrl != null) {
                    console.log(colors.yellow("\n", txUrl));
                }
            } catch (error) {
                console.log(colors.red("\n Expiring EMP failed: ....."));
                console.log(error);
            }

        }
    );