const { expect } = require("chai")
const { ethers } = require("hardhat")
const hre = require("hardhat")
const assert = require("assert")

let clayToken;
let accounts;
let TokenAddress;

describe("Clay Token Contract", function () {
    before('deploy contracts', async function () {

        accounts = await ethers.getSigners()

        console.log(
            "Deploying Clay token with the account:",
            accounts[0].address
        );

        console.log("Account 1 balance:", (await accounts[2].getBalance()).toString())


        // Deploy Token Contract
        const ClayToken = await hre.ethers.getContractFactory('ClayToken')
        clayToken = await ClayToken.deploy()
        TokenAddress = clayToken.address
        await clayToken.deployed()
        console.log("Clay Token contract deployed at: " + TokenAddress)

    });
    it('Token has the correct name & symbol & decimals', async function () {
        const name = await clayToken.name()
        const symbol = await clayToken.symbol()
        const decimals = await clayToken.decimals()

        expect(name).to.equal("Clay Token")
        expect(symbol).to.equal("CLAY")
        expect(decimals).to.equal(18)
    });

    it('Mints Clay token to  Account 1', async function () {
        expect(await clayToken.balanceOf(accounts[1].address)).to.equal(0)
        await clayToken.mint(accounts[1].address, ethers.utils.parseUnits('10.0', 'ether'))
        const balance = await clayToken.balanceOf(accounts[1].address)
        expect(balance).to.equal(ethers.utils.parseEther("10.0"))
    });

    it("Transfer Clay Token from Account1 to Account2", async () => {
        expect(await clayToken.balanceOf(accounts[2].address)).to.equal(0)
        await clayToken.connect(accounts[1]).transfer(accounts[2].address, ethers.utils.parseUnits('10.0', 'ether'))
        expect(await clayToken.balanceOf(accounts[2].address)).to.equal(ethers.utils.parseUnits('10.0', 'ether'))
    })

    it("Can be transferred indirectly(approval)", async () => {
        await clayToken.connect(accounts[2]).approve(accounts[3].address, ethers.utils.parseUnits('5.0', 'ether'))
        expect(await clayToken.allowance(accounts[2].address, accounts[3].address)).to.equal(ethers.utils.parseUnits('5.0', 'ether'))

        await expect(clayToken.connect(accounts[3]).transferFrom(accounts[2].address, accounts[4].address, ethers.utils.parseUnits('5.1', 'ether'))).to.be.reverted;
        await clayToken.connect(accounts[3]).transferFrom(accounts[2].address, accounts[4].address, ethers.utils.parseUnits('5.0', 'ether'))
        expect(await clayToken.balanceOf(accounts[4].address)).to.equal(ethers.utils.parseUnits('5.0', 'ether'))

        expect(await clayToken.allowance(accounts[2].address, accounts[3].address)).to.equal(ethers.utils.parseUnits('0.0', 'ether'))
    })

  


});