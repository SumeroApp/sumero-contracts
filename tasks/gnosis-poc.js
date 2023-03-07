task("gnosis-poc", "POC of gnosis safe")
    .setAction(async (args, hre) => {
        const Safe = require('@safe-global/safe-core-sdk')
        const { SafeEthersSigner, SafeService } = require('@safe-global/safe-ethers-adapters')

        const ethAdapter = require('../gnosis/adapter')

        const service = new SafeService(process.env.SERVICE_URL)
       
        const safe = await Safe.default.create({ ethAdapter: ethAdapter, safeAddress: process.env.DEPLOYER_SAFE })
        console.log("Safe created")

        const safeSigner = new SafeEthersSigner(safe, service, hre.network.provider)
        console.log("Safe singer initialized")

        const contract = await hre.ethers.getContractAt("USDC", "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", safeSigner)

        const anyRandomAddressForTest = '0x64dF8E9fF3B28c784f3822968523DC7e74c30858'

        console.log("Proposing a gnosis safe tx");
        
        const proposedTx = await contract.approve(anyRandomAddressForTest, '7565687')
        console.log("USER ACTION REQUIRED")
        console.log("Go to the Safe Web App to confirm the transaction")
        console.log(await proposedTx.wait())
        console.log("Transaction has been executed")
    })

