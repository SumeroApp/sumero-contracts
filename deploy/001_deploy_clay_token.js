/**
 * This script deploys the native CLAY token contract
 * 
 */

const { getWallet1, getWallet } = require("../utils/gnosis.wallet");


const func = async function (hre) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    console.log({
        deployer
    })

    // const gnosisDeployer = setupSafeDeployer(
    //     deployer,
    //     'gor:0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163',
    //     'https://safe-transaction-goerli.safe.global/'
    // )

    // console.log({
    //     getWallet: await getWallet()
    // })
    const wallet = await getWallet1(ethers);
    console.log("now deploying", wallet)
    const ClayToken = await ethers.getContractFactory("ClayToken")
    ClayToken.connect(wallet)
    console.log({
        ClayToken: ClayToken.signer
    })
    console.log({
        bal: await ClayToken.symbol()
    })

    // await deploy("ClayToken", { from: await getWallet(ethers), log: true, skipIfAlreadyDeployed: true });
};
module.exports = func;
func.tags = ["ClayToken"];
