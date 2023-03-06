const { Interface } = require('@ethersproject/abi')
const { getAddress } = require('@ethersproject/address')
const { getCreateCallDeployment } = require('@safe-global/safe-deployments')

const createLibDeployment = getCreateCallDeployment()
const createLibAddress = createLibDeployment.defaultAddress
const createLibInterface = new Interface(createLibDeployment.abi)

const mapStatus = (receipt) => {
  // Search for ExecutionSuccess event (see https://github.com/safe-global/safe-contracts/blob/v1.3.0/contracts/GnosisSafe.sol#L49)
  const success = receipt.logs.find(
    (log) =>
      log.topics[0] === '0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e'
  )
  return !!success ? 1 : 0
}

const mapContractAddress = (receipt, safeTx) => {
  if (safeTx.to.toLowerCase() === createLibAddress.toLowerCase()) {
    // Search for ContractCreation event (see https://github.com/safe-global/safe-contracts/blob/v1.3.0/contracts/libraries/CreateCall.sol#L7)
    const creationLog = receipt.logs.find(
      (log) =>
        log.topics[0] === '0x4db17dd5e4732fb6da34a148104a592783ca119a1e7bb8829eba6cbadef0b511'
    )
    if (creationLog) return getAddress('0x' + creationLog.data.slice(creationLog.data.length - 40))
  }
  return receipt.contractAddress
}

const mapReceipt = (receipt, safeTx) => {
  // Update status with Safe tx status and extract created contract
  receipt.status = mapStatus(receipt)
  receipt.contractAddress = mapContractAddress(receipt, safeTx)
  return receipt
}

module.exports = {
    mapReceipt,
    createLibDeployment,
    createLibAddress,
    createLibInterface
}