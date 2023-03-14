
async function submitTransactionToGnosisSafe(deployerSafeAddress, artifact, functionName, ...args) {
    if (!ethers.utils.isAddress(deployerSafeAddress)) throw new Error("Invalid safe address")
    const getGnosisSigner = require('./signer');
    const colors = require('colors');
    const signer = await getGnosisSigner(deployerSafeAddress)
    hre.network.name == 'dashboard' ? console.log(colors.blue("OPEN TRUFFLE DASHBOARD TO SIGN TXN")) : console.log(colors.green("Signing Tx with gnosis signer"))
    const tx = await artifact.connect(signer)[functionName](...args)
    console.log("Gnosis tx hash: ", tx.hash)
    console.log(`Go to gnosis dashboard to view/confirm the txn: https://app.safe.global/transactions/queue?safe=${deployerSafeAddress}`)
    return tx
}

module.exports = submitTransactionToGnosisSafe