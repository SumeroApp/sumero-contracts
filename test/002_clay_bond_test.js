const { expect } = require("chai")
const { ethers } = require("hardhat")
const hre = require("hardhat")

let clayToken;
let accounts;
let ClayAddress;
let clayBonds;
let ClayBondsAddress;
let daysLeftToMaturationDate;
let clayAmount;

async function increaseTime(amount) {
    await hre.network.provider.send("evm_increaseTime", [amount])
    console.log("EVM time " + amount + " seconds increased!")
}

//npx hardhat test ./test/002_clay_bond_test.js --network hardhat

describe("Clay Bonds Contract", function () {
    before('deploy contracts', async function () {
        accounts = await ethers.getSigners()

        console.log(
            "Deploying Clay and zClay with the account:",
            accounts[0].address
        );

        console.log("Account 1 balance:", (await accounts[2].getBalance()).toString())


        // Deploy Clay Token Contract
        const ClayToken = await hre.ethers.getContractFactory('ClayToken')
        clayToken = await ClayToken.deploy()
        ClayAddress = clayToken.address
        await clayToken.deployed()
        console.log("\nClay Token contract deployed at: " + ClayAddress)

        // Deploy Clay Bonds Contract
        const ClayBonds = await hre.ethers.getContractFactory('ClayBonds')
        clayBonds = await ClayBonds.deploy(ClayAddress, ethers.utils.parseUnits('100.0', 'ether'))
        ClayBondsAddress = clayBonds.address

        await clayBonds.deployed()
        console.log("\nClay Bond contract deployed at: " + ClayBondsAddress)

        // Check contract names and symbols
        expect(await clayToken.name()).to.be.eq("Clay Token")
        expect(await clayToken.symbol()).to.be.eq("CLAY")
        expect(await clayBonds.name()).to.be.eq("zClay Token")
        expect(await clayBonds.symbol()).to.be.eq("zCLAY")
        
    });

    it('Mints Clay token to  Account 1', async function () {
        console.log("\n Minting 1 Clay Token to Account 1: .....")
        expect(await clayToken.balanceOf(accounts[1].address)).to.equal(0)
        await clayToken.mint(accounts[1].address, ethers.utils.parseUnits('1.0', 'ether'))
        const balance = await clayToken.balanceOf(accounts[1].address)
        expect(balance).to.equal(ethers.utils.parseEther("1.0"))
        expect(await clayToken.totalSupply()).to.eq(balance)
    });

    it("Approves allowance of user's clay to clay bonds ", async function () {
        console.log("\nApproving allowance of User's CLAY to ClayBonds : .....")
        await clayToken.connect(accounts[1]).approve(ClayBondsAddress, ethers.utils.parseUnits('1.0', 'ether'));
        expect(await clayToken.allowance(accounts[1].address, ClayBondsAddress)).to.equal(ethers.utils.parseUnits('1.0', 'ether'))
    });

    it('Gets Deposit Start Date, Deposit Close Date, Maturaton Date, Daily Yield Percent & Maximum Bond Rewards ', async function () {
        console.log("\nGetting Deposit Start Date, Deposit Close Date, Maturaton Date, Daily Yield Percent & Maximum Bond Rewards : .....")

        const depositStartDate = await clayBonds.depositStartDate()
        const depositCloseDate = await clayBonds.depositCloseDate()
        const dailyYieldPercent = await clayBonds.dailyYieldPercent()
        const maturationDate = await clayBonds.maturationDate()
        const maximumBondRewards = await clayBonds.maximumBondRewards()
        const apy_percent = await clayBonds.APY_PERCENT()
        const bonus_apy_percent = await clayBonds.BONUS_APY_PERCENT()

        console.log("\nDeposit Start Date: " + depositStartDate)
        console.log("Deposit Close Date: " + depositCloseDate)
        console.log("Daily Yield Percent: " + dailyYieldPercent)
        console.log("Maximum Bond Rewards: " + ethers.utils.formatEther(maximumBondRewards) + "ether")
        console.log("Maturation Date: " + maturationDate)


        //DailyYieldPercent = (APY_PERCENT.add(BONUS_APY_PERCENT)).mul(1 ether).div(365); 
        let multiplier = ethers.BigNumber.from("1000000000000000000")
        let dailyYield = multiplier.mul(apy_percent.add(bonus_apy_percent)).div(365)

        // 3 years in seconds: 94608000
        expect(maturationDate.sub(depositStartDate)).to.be.eq(94608000)
        // 1 year in seconds: 31536000
        expect(depositCloseDate.sub(depositStartDate)).to.be.eq(31536000)
        expect(dailyYield).to.be.eq(dailyYieldPercent)
    });

    it("Provides CLAY liquidity to bonds contract ", async () => {
        console.log("\nBond Issuance reverts incase of insufficient CLAY liquidity: .....")
        let beforeSupply = await clayToken.totalSupply()
        await expect(clayBonds.connect(accounts[1]).issue(ethers.utils.parseUnits('1.0', 'ether'))).to.be.reverted
        let amount =  ethers.utils.parseUnits('1.8', 'ether')
        await clayToken.mint(ClayBondsAddress,amount)
        // Updated supply must be equal to: beforeSupply + amount
        expect(beforeSupply.add(amount)).to.be.eq(await clayToken.totalSupply())
    })

    it("Issues zCLAY bonds ", async () => {
        console.log("\nIssuing zClayBonds: .....")

        clayAmount = ethers.utils.parseUnits('1.0', 'ether')
        const issueTx = await clayBonds.connect(accounts[1]).issue(clayAmount)
        const issueReceipt = await issueTx.wait()
        let bondBalanceOfUser = await clayBonds.balanceOf(accounts[1].address)
        let contractBalance = await clayToken.balanceOf(ClayBondsAddress)
        console.log("Bonds balance of user: " + bondBalanceOfUser )
        console.log("Clay balance of ClayBonds Contract: " + contractBalance )
        console.log("Total Bond Deposits: ", (await clayBonds.totalBondDeposits()).toString())
        console.log("hasEnoughClayLiquidity: ", (await clayBonds.hasEnoughClayLiquidity()).toString())

        daysLeftToMaturationDate = clayBonds.getDaysLeftToMaturationDate()

        expect(await clayBonds.totalSupply()).to.be.eq(bondBalanceOfUser)
        expect(await clayToken.totalSupply()).to.be.eq(contractBalance)
    })
    it("Manipulates the time ", async () => {
        console.log("\nManipulating the EVM time: .....")
        const maturationDate = await clayBonds.maturationDate()
        const currentBlock = await ethers.provider.getBlockNumber()
        const timestamp = (await ethers.provider.getBlock(currentBlock)).timestamp
        console.log("Current timestamp : " + timestamp)
        console.log("Maturation Date  : " + maturationDate)
        const differance = maturationDate - timestamp
        increaseTime(differance)
    })
    it("claims after the maturation", async () => {
        console.log("\nClaiming after the maturation: .....")
        console.log("Balance before claim: " + await clayToken.balanceOf(accounts[1].address))
        const claimResult = await clayBonds.connect(accounts[1]).claim()
        const issueReceipt = await claimResult.wait()
        // console.log(issueReceipt)
        const afterBalance = await clayToken.balanceOf(accounts[1].address)
        console.log("Balance after claim: " + afterBalance)

        let rewardPercent = ethers.BigNumber.from(await clayBonds.getRewardPercent(daysLeftToMaturationDate))
        let reward = ethers.BigNumber.from(await clayBonds.getReward(clayAmount, rewardPercent))

        let bondAmount = reward.add(clayAmount)
        expect(bondAmount).eq(afterBalance)
    })
});