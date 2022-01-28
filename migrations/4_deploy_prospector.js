// // helpers
// const { isDevNetwork } = require("../helpers");

// const ClayToken = artifacts.require('ClayToken.sol');
// const Prospector = artifacts.require('Prospector.sol');

// // Deploy MasterChef / Prospector Contract
// module.exports = async (deployer, network, accounts) => {
//     // local ganache instance
//     if (isDevNetwork('development')) {
//         await deployer.deploy(
//             Prospector,
//             clay.address,
//             web3.utils.toWei('100'),
//             blockNumber,
//             blockNumber + 1000,
//             blockNumber + 2000,
//             25
//         );
//         const prospector = await Prospector.deployed();
//         await prospector.add(web3.utils.toWei('10'), wethSignoPair, false);
//         await prospector.add(web3.utils.toWei('10'), wethTokenAPair, false);
//     }


//     //kovan testnet

//     // mainnet
// }