// npx hardhat settle-emp --emp-address 0x303a5cf0dddb63bebe35f1e925456d4fd8578a1b 0xc18c10e83eE8036e083202Ee0B56fb522C245A5D --synth-address   --network kovan

const { provider } = require('ganache');

// after expiry contract state is 1
task("settle-emp", "Expires emps")
    .addParam("empAddress", "Emp Address")
    .addParam("synthAddress", "Synthetic Token Address")
    .setAction(
        async (args, deployments, network) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl } = require('../utils/helper');

            const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
            const emp = await EMP.attach(args.empAddress);

            const synthToken = await hre.ethers.getContractFactory("contracts/UMA/common/implementation/ExpandedERC20.sol:ExpandedERC20");
            const synth = await synthToken.attach(args.synthAddress);

            const synthBalance = synth.balanceOf(deployer)
            console.log("Approving synths...")
            try {
                const approveTX = await synth.approve(args.synthAddress, synthBalance)
                const approveTxUrl = getTxUrl(deployments.network, approveTX.hash);
                if (approveTxUrl != null) {
                    console.log(approveTxUrl);
                }
                console.log("Approve completed...")
            } catch (error) {
                console.log("Approve failed!");
                console.log(error);
            }

            console.log("\n Settling the position: .....");
            try {
                console.log("Contract State: " + await emp.contractState())
                const expireEmpTx = await emp.settleExpired()
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
