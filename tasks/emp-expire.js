
// npx hardhat emp-expire --address <address> --network <network-name>

task("emp-expire", "Expires EMPs")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if trasactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .addParam("address", "Address of EMP to expire")
    .setAction(
        async (args, hre) => {
            const { expect } = require('chai');
            const { getTxUrl } = require('../utils/helper');
            const colors = require('colors');
            const getGnosisSigner = require('../gnosis/signer');

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            let emp = await EMP.attach(args.address);
            if(args.gnosisSafe){
                emp = emp.connect(await getGnosisSigner(args.gnosisSafe))
            }
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