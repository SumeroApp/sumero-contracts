const Safe = require('@safe-global/safe-core-sdk')
const { SafeEthersSigner, SafeService } = require('@safe-global/safe-ethers-adapters')
const ethAdapter = require('./adapter')

async function getGnosisSigner(deployerSafeAddress){
        if( !process.env.SERVICE_URL || process.env.SERVICE_URL == '') throw new Error("SERVICE_URL not defined/empty in .env")

        console.log("Initializing safe signer: ", deployerSafeAddress)
        const service = new SafeService(process.env.SERVICE_URL)
        const safe = await Safe.default.create({ ethAdapter: ethAdapter, safeAddress: deployerSafeAddress })
        console.log("Safe created")

        const safeSigner = new SafeEthersSigner(safe, service, hre.network.provider)
        console.log("Safe singer initialized")
        return safeSigner
}

module.exports = getGnosisSigner