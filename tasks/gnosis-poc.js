task("erc20-approve", "Approves ERC20 tokens to the given account")
    .setAction(async (args, hre) => {

        const { Contract, Signer, providers } = require('ethers')
        const Safe = require('@safe-global/safe-core-sdk')
        const EthersAdapter = require('@safe-global/safe-ethers-lib')
        // const { ethers } = require('ethers')
        const SafeService = require('../gnosis/service')
        const SafeEthersSigner = require('../gnosis/signer')

        console.log("Setup provider")
        console.log("Setup SafeService")
        const service = new SafeService(process.env.SERVICE_URL)
        console.log("Setup Signer")
        const [owner] = await hre.ethers.getSigners();

        // const owner1 = owner.connect(new providers.JsonRpcProvider(process.env.ETH_NODE_URI_GOERLI))

        console.log("Setup SafeEthersSigner", process.env.DEPLOYER_SAFE)
        const ethAdapter = new EthersAdapter.default({ ethers: hre.ethers, owner })

        const safe = await Safe.default.create({ ethAdapter, safeAddress: process.env.DEPLOYER_SAFE })
        const safeSigner = new SafeEthersSigner(safe, service, owner.provider)
        const contract = new Contract("0xe50c6391a6cb10f9B9Ef599aa1C68C82dD88Bd91", ["function pin(string newMessage)"], safeSigner)
        const proposedTx = await contract.functions.pin(`Local time: ${new Date().toLocaleString()}`)
        console.log("USER ACTION REQUIRED")
        console.log("Go to the Safe Web App to confirm the transaction")
        console.log(await proposedTx.wait())
        console.log("Transaction has been executed")
    })
