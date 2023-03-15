task("gnosis-poc", "POC of gnosis safe")
    .setAction(async (args, hre) => {
        
        const getGnosisSigner = require("../gnosis/signer");

        const contract = await hre.ethers.getContractAt("USDC", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", await getGnosisSigner('0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163'))

        const anyRandomAddressForTest = '0x64dF8E9fF3B28c784f3822968523DC7e74c30858'

        console.log("Proposing a gnosis safe tx");

        const proposedTx = await contract.approve(anyRandomAddressForTest, '7565687')
        console.log("USER ACTION REQUIRED")
        console.log("Go to the Safe Web App to confirm the transaction")
        console.log(await proposedTx.wait())
        console.log("Transaction has been executed")
    })

