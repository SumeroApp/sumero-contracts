const Safe = require('@safe-global/safe-core-sdk')
const { SafeEthersSigner, SafeService } = require('@safe-global/safe-ethers-adapters')
const ethAdapter = require('./adapter')

const chaidIdToServiceUrl = {
        1: 'https://safe-transaction-mainnet.safe.global',
        5: 'https://safe-transaction-goerli.safe.global',
    }

async function getGnosisSigner(deployerSafeAddress){
        if (!ethers.utils.isAddress(deployerSafeAddress)) throw new Error("Invalid safe address")
        const chainId = await ethAdapter.getChainId()
        console.log("Initializing safe: ", deployerSafeAddress)
        const service = new SafeService(chaidIdToServiceUrl[chainId])
        const safe = await Safe.default.create({ ethAdapter: ethAdapter, safeAddress: deployerSafeAddress })
        console.log("Safe created")

        const safeSigner = new SafeEthersSigner(safe, service, new hre.ethers.providers.Web3Provider(hre.network.provider))
        console.log("Safe initialized")
        return safeSigner
}

module.exports = getGnosisSigner