const { expect } = require("chai")
const { ethers } = require("hardhat")
const hre = require("hardhat")

let clayToken;
let accounts;
let ClayAddress;
let clayBonds;
let ClayBondsAddress;
let daysLeftToMaturationDate;
// issued bond amount by the user
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

    it("should fail to deploy a Clay Bond Contract with zero address for ClayToken", async () => {
        const ClayBonds = await hre.ethers.getContractFactory('ClayBonds')
        await expect(ClayBonds.deploy(ethers.constants.AddressZero, ethers.utils.parseUnits('100.0', 'ether'))).to.be.revertedWith("ClayBonds: ZERO_ADDRESS");
    })

    it('Gives minting & burning access to Clay Bonds contract', async function () {
        console.log("\nGiving access to Clay Bonds contract for minting & burning Clay  : .....")
        const minterRoleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"))
        const burnerRoleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("BURNER_ROLE"))
        await clayToken.grantRole(minterRoleHash, ClayBondsAddress)
        await clayToken.grantRole(burnerRoleHash, ClayBondsAddress)
        expect(await clayToken.hasRole(minterRoleHash, ClayBondsAddress)).eq(true)
        expect(await clayToken.hasRole(burnerRoleHash, ClayBondsAddress)).eq(true)

    });
    it('Mints Clay to  Account 1', async function () {
        console.log("\n Minting 1 Clay to Account 1: .....")
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

        console.log("\nDeposit Start Date: " + depositStartDate)
        console.log("Deposit Close Date: " + depositCloseDate)
        console.log("Daily Yield Percent: " + dailyYieldPercent)
        console.log("Maximum Bond Rewards: " + ethers.utils.formatEther(maximumBondRewards) + "ether")
        console.log("Maturation Date: " + maturationDate)


        let multiplier = ethers.BigNumber.from("1000000000000000000")
        let dailyYield = multiplier.mul(apy_percent).div(365)

        // 1 day in seconds => 86400
        // 1 year in seconds => 86400 * 365 => 31536000
        // 2 year in seconds: 31536000 * 2 => 63072000
        // adding 1 day extra for leap year 2024 => 63072001
        expect(maturationDate.sub(depositStartDate)).to.be.eq(63072001)

        // 180 days in seconds => 86400 * 180 => 15552000
        expect(depositCloseDate.sub(depositStartDate)).to.be.eq(15552000)
        expect(dailyYield).to.be.eq(dailyYieldPercent)
    });
    it("Issues zCLAY bonds ", async () => {
        console.log("\nIssuing zClayBonds: .....")

        clayAmount = ethers.utils.parseUnits('1.0', 'ether')
        daysLeftToMaturationDate = await clayBonds.getDaysLeftToMaturationDate()
        let rewardPercent = ethers.BigNumber.from(await clayBonds.getRewardPercent(daysLeftToMaturationDate))
        let reward = ethers.BigNumber.from(await clayBonds.getReward(clayAmount, rewardPercent))
        await expect(clayBonds.connect(accounts[1]).issue(clayAmount))
            .to.emit(clayBonds, "Issued").withArgs(accounts[1].address, clayAmount, daysLeftToMaturationDate, rewardPercent, reward)

        let bondBalanceOfUser = await clayBonds.balanceOf(accounts[1].address)
        let contractBalance = await clayToken.balanceOf(ClayBondsAddress)

        console.log("User Clay invesment: " + clayAmount)
        console.log("User estimated reward: " + reward)
        console.log("Bonds balance of user: " + bondBalanceOfUser)
        console.log("Clay balance of ClayBonds Contract: " + contractBalance)
        console.log("Total Bond Deposits: ", (await clayBonds.totalBondDeposits()).toString())

        expect(reward.add(clayAmount)).to.be.eq(bondBalanceOfUser)
        expect(await clayToken.totalSupply()).to.be.eq(contractBalance)
    })
    it("Manipulates the time and tests time dependent functions(claim & burn)", async () => {
        console.log("\nTesting time dependent Claim and Burn function: .....")
        await expect(clayBonds.burn()).to.be.reverted
        await expect(clayBonds.connect(accounts[1]).claim()).to.be.reverted
        console.log("\nManipulating the EVM time: .....")
        const maturationDate = await clayBonds.maturationDate()
        const currentBlock = await ethers.provider.getBlockNumber()
        const timestamp = (await ethers.provider.getBlock(currentBlock)).timestamp
        console.log("Current timestamp : " + timestamp)
        console.log("Maturation Date  : " + maturationDate)
        const difference = maturationDate - timestamp
        increaseTime(difference)
    })
    it("Claims after the maturation", async () => {
        console.log("\nClaiming after the maturation: .....")
        console.log(" User's Clay balance before claim: " + await clayToken.balanceOf(accounts[1].address))
        const userBondsBalance = await clayBonds.balanceOf(accounts[1].address)
        await expect(clayBonds.connect(accounts[1]).claim()).to.emit(clayBonds, "Claimed").withArgs(accounts[1].address, userBondsBalance);

        const afterBalance = await clayToken.balanceOf(accounts[1].address)
        console.log("User's Clay balance after claim: " + afterBalance)

        let rewardPercent = ethers.BigNumber.from(await clayBonds.getRewardPercent(daysLeftToMaturationDate))
        let reward = ethers.BigNumber.from(await clayBonds.getReward(clayAmount, rewardPercent))

        let bondAmount = reward.add(clayAmount)
        let bondBalanceOfUser = await clayBonds.balanceOf(accounts[1].address)

        expect(bondBalanceOfUser).eq(0)
        expect(afterBalance).eq(bondAmount)

        console.log("Reward: " + reward)
        console.log("Bond amount: " + bondAmount)
        console.log("After: user's Clay balance: " + afterBalance)
        console.log("Clay balance of the contract:" + await clayToken.balanceOf(ClayBondsAddress))
    })
    it("Burns remained Clay balance of ClayBonds Contract after the Maturation Date", async () => {
        console.log("\nBurning the remaining Clays after the maturation: .....")
        let beforeClaySupply = await clayToken.totalSupply();
        let beforeContractBalance = await clayToken.balanceOf(ClayBondsAddress)
        // only owner can call
        await expect(clayBonds.connect(accounts[3]).burn()).to.be.reverted

        const BondsContractClayBalance = await clayToken.balanceOf(ClayBondsAddress)
        await expect(clayBonds.burn()).to.emit(clayBonds, "Burned").withArgs(BondsContractClayBalance);

        let afterClaySupply = await clayToken.totalSupply();
        let afterContractBalance = await clayToken.balanceOf(ClayBondsAddress)

        expect(beforeClaySupply.sub(afterClaySupply)).eq(clayAmount)
        expect(beforeContractBalance).eq(clayAmount)
        expect(afterContractBalance).eq(0)

        console.log("Before: Clay supply: " + beforeClaySupply)
        console.log("After: Clay supply: " + afterClaySupply)
        console.log("Before: Clay balance of the contract: " + beforeContractBalance)
        console.log("After: Clay balance of the contract: " + afterContractBalance)

    })
});