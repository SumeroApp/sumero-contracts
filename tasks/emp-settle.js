// npx hardhat emp-settle --emp-address <address> --synthAddress <address> --network <network-name>

task("emp-settle", "Settles emps")
    .addParam("empAddress", "Address of EMP contract")
    .addParam("synthAddress", "Address of the synthetic token contract")
    .setAction(
        async (args, hre) => {
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');
            const colors = require('colors');

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const emp = await EMP.attach(args.empAddress);

            const SYNTH = await hre.ethers.getContractFactory("contracts/UMA/common/implementation/ExpandedERC20.sol:ExpandedERC20");
            const synth = await SYNTH.attach(args.synthAddress);

            const synthBalance = synth.balanceOf(deployer)
            console.log(colors.blue("\n Approving synths: ....."));
            try {
                const approveTX = await synth.approve(args.empAddress, synthBalance);
                const approveTxUrl = getTxUrl(hre.deployments.getNetworkName(), approveTX.hash);
                if (approveTxUrl != null) {
                    console.log(colors.yellow("\n", approveTxUrl));
                }
                console.log("Approve completed...")
            } catch (error) {
                console.log("Approving synthetic tokens failed...");
                console.log(error);
            }

            console.log(colors.blue("\n Settling EMPs: ....."));
            try {
                console.log("Contract State: " + await emp.contractState())
                const expireEmpTx = await emp.settleExpired()
                await expireEmpTx.wait();
                const txUrl = getTxUrl(hre.deployments.getNetworkName(), expireEmpTx.hash);
                if (txUrl != null) {
                    console.log(colors.yellow("\n", txUrl));
                }
            } catch (error) {
                console.log(colors.red("\n Settling EMP failed: ....."));
                console.log(error);
            }

        }
    );