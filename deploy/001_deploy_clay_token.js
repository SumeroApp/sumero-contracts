// hardhat
const { expect } = require("chai");

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log("Deployer address is:", deployer);

    const ClayTokenDeployed = await deploy('ClayToken', {
        from: deployer,
        gasLimit: 4000000,
        args: [],
    });
    console.log("Clay Token Deployed at:", ClayTokenDeployed.address);

    const clayToken = await ethers.getContract("ClayToken", deployer);

    {
        // test
        // mint CLAY token to accounts[0]
        await clayToken.mint(deployer, web3.utils.toWei('800000', 'ether'));
        const clayTokenBalance = (await clayToken.balanceOf(deployer)).toString();

        expect(web3.utils.fromWei(clayTokenBalance)).to.equal('800000', "Clay Token Balance doesn't match");

        // mint CLAY token to metamask wallet address
        await clayToken.mint("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", web3.utils.toWei('800000', 'ether'));
        const metamaskAddressBalance = (await clayToken.balanceOf(deployer)).toString();

        expect(web3.utils.fromWei(metamaskAddressBalance)).to.equal('800000', "Clay Token Balance doesn't match");
    }

    console.log("Clay Token Minted and Tested");

};