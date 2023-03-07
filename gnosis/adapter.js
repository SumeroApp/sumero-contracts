const { ethers } = hre
const EthersAdapter = require('@safe-global/safe-ethers-lib')

const provider = new ethers.providers.Web3Provider(hre.network.provider)
const safeOwner = provider.getSigner(0)

const ethAdapter = new EthersAdapter.default({
  ethers,
  signerOrProvider: safeOwner
})

module.exports = ethAdapter