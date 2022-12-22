//npx hardhat test test/003_staking_rewards_test.js

const { expect } = require("chai")
const { ethers } = require("hardhat")
const { BigNumber, constants } = ethers
const hre = require("hardhat")
const { getEpochFromDate } = require("../utils/helper")

const wait = (seconds) => new Promise((resolve) => {
    setTimeout(() => { resolve() }, seconds * 1000)
})

async function increaseTime(amount) {
    await hre.network.provider.request({
        method: 'evm_increaseTime',
        params: [amount],
    })
    await network.provider.send("evm_mine")
    console.log("EVM time " + amount + " milliseconds increased!")
}

let clayToken;
let sumeroLpToken;
let stakingRewards;
let accounts;
let TokenAddress;
let LpTokenAddress;
let StakingRewardsAddress;
const dayInMs = 60 * 60 * 24 * 1000;

describe("Staking Rewards Contract", function () {
    before('deploy contracts', async function () {

        accounts = await ethers.getSigners()

        console.log(
            "Deploying Clay token with the account:",
            accounts[0].address
        );

        console.log("Account 1 balance:", (await accounts[1].getBalance()).toString())


        // Deploy Clay Token Contract
        const ClayToken = await hre.ethers.getContractFactory('ClayToken')
        clayToken = await ClayToken.deploy()
        await clayToken.deployed()
        TokenAddress = clayToken.address
        console.log("Clay Token contract deployed at: " + TokenAddress)

        // Deploy Sumero LP Token Contract
        const SumeroLpToken = await hre.ethers.getContractFactory('contracts/test/SumeroLpToken.sol:SumeroLpToken')
        sumeroLpToken = await SumeroLpToken.deploy()
        await sumeroLpToken.deployed()
        LpTokenAddress = sumeroLpToken.address
        console.log("Staking Token contract deployed at: " + LpTokenAddress)

        // Deploy Staking Contract
        const expiry = getEpochFromDate(new Date(Date.now() + dayInMs * 30 * 2))
        const maxReward = BigNumber.from(10).pow(20);
        const StakingRewards = await hre.ethers.getContractFactory('ClayStakingRewards')
        stakingRewards = await StakingRewards.deploy(LpTokenAddress, TokenAddress, expiry, maxReward)
        StakingRewardsAddress = stakingRewards.address
        await stakingRewards.deployed()
        console.log("Staking Rewards contract deployed at: " + StakingRewardsAddress)
        console.log(`
        Reward rate: ${(await stakingRewards.rewardRate())}
        expiry: ${new Date((await stakingRewards.expiry()) * 1000)}
        `);

    });

    it('Gives minting access to staking contract', async function () {
        const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"))
        await clayToken.grantRole(roleHash, StakingRewardsAddress)
        expect(await clayToken.hasRole(roleHash, StakingRewardsAddress)).eq(true)

    });

    it('Can update reward rate', async function () {
        await expect(stakingRewards.connect(accounts[2]).updateRewardRate(20)).to.be.reverted
        await expect(stakingRewards.updateRewardRate(20)).to.emit(stakingRewards, "RewardRateUpdated").withArgs(20)
        expect(await stakingRewards.rewardRate()).to.eq(20)
    });

    it('Mints staking token to Account 1', async function () {
        expect(await sumeroLpToken.balanceOf(accounts[1].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[1].address, ethers.utils.parseUnits('10.0', 'ether'))
        const balance = await sumeroLpToken.balanceOf(accounts[1].address)
        expect(balance).to.equal(ethers.utils.parseEther("10.0"))
    });

    it('Stakes LP token from Account 1', async function () {
        // expect(await stakingRewards.rewardPerToken()).to.be.eq(0)
        const amount = ethers.utils.parseUnits('10.0', 'ether')
        expect(await sumeroLpToken.balanceOf(accounts[1].address)).to.equal(amount)
        await sumeroLpToken.connect(accounts[1]).approve(StakingRewardsAddress, amount)
        expect(await sumeroLpToken.allowance(accounts[1].address, StakingRewardsAddress)).to.eq(amount)
        await expect(stakingRewards.connect(accounts[1]).stake(amount)).to.emit(stakingRewards, "Staked")
        expect(await stakingRewards.balanceOf(accounts[1].address)).to.eq(amount)
        expect(await stakingRewards.totalSupply()).to.eq(amount)

    });

    it('It must calculate the reward value correctly ', async function () {

        const rewardRate = await stakingRewards.rewardRate()
        const lastUpdateTime = await stakingRewards.lastUpdateTime()
        const currentBlock = await ethers.provider.getBlockNumber()
        const timestamp = (await ethers.provider.getBlock(currentBlock)).timestamp
        const totalSupply = await stakingRewards.totalSupply()
        let multiplier = ethers.BigNumber.from("10").pow(BigNumber.from(18))
        //rewardPerTokenStored + ((rewardRate * (block.timestamp - lastUpdateTime) * 1e18) / _totalSupply);
        let updatedRewardPerToken = ethers.BigNumber.from(rewardRate.mul(timestamp - lastUpdateTime).mul(multiplier).div(totalSupply))
        expect(await stakingRewards.rewardPerToken()).to.be.eq(updatedRewardPerToken)
    });
    // todo: Withdraw partial amount
    it('Withdraws(Unstakes) LP tokens', async function () {
        const amount = ethers.utils.parseUnits('10.0', 'ether')
        expect(await sumeroLpToken.balanceOf(accounts[1].address)).to.eq(0)
        expect(await stakingRewards.balanceOf(accounts[1].address)).to.eq(amount)
        await expect(stakingRewards.connect(accounts[1]).withdraw(amount)).to.emit(stakingRewards, "Withdrawn").withArgs(accounts[1].address, amount)
        expect(await stakingRewards.balanceOf(accounts[1].address)).to.eq(0)
        expect(await sumeroLpToken.balanceOf(accounts[1].address)).to.eq(amount)
    });

    it('Gets staking rewards', async function () {
        const reward = await stakingRewards.rewards(accounts[1].address)
        await expect(stakingRewards.connect(accounts[1]).getReward()).to.emit(stakingRewards, "RewardPaid").withArgs(accounts[1].address, reward)
        expect(await clayToken.balanceOf(accounts[1].address)).to.eq(reward)
        expect(await stakingRewards.rewards(accounts[1].address)).to.eq(0)
    });

    it('Can pause the contract', async function () {
        // Owner: Account[0]
        await expect(stakingRewards.connect(accounts[1]).pause()).to.be.reverted
        await stakingRewards.pause()
        await expect(stakingRewards.connect(accounts[1]).unpause()).to.be.reverted

        // Mint Staking tokens to account 2
        expect(await sumeroLpToken.balanceOf(accounts[2].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[2].address, ethers.utils.parseUnits('6.0', 'ether'))
        const balance = await sumeroLpToken.balanceOf(accounts[2].address)
        expect(balance).to.equal(ethers.utils.parseEther("6.0"))

        // Give allowance to the staking contract from account 2
        const amount = ethers.utils.parseUnits('6.0', 'ether')
        await sumeroLpToken.connect(accounts[2]).approve(StakingRewardsAddress, amount)
        expect(await sumeroLpToken.allowance(accounts[2].address, StakingRewardsAddress)).to.eq(amount)

        // Cannot stake when paused
        await expect(stakingRewards.connect(accounts[2]).stake(amount)).to.be.revertedWith('Pausable: paused')

        // Unpause the contract
        await stakingRewards.unpause()

        // Can stakes LP Token from Account 2 when unpaused
        await stakingRewards.connect(accounts[2]).stake(amount)
        expect(await stakingRewards.balanceOf(accounts[2].address)).to.eq(amount)

        // Pause the contract
        await stakingRewards.pause()

        // Can withdraw when paused
        expect(await stakingRewards.balanceOf(accounts[2].address)).to.eq(amount)
        await stakingRewards.connect(accounts[2]).withdraw(amount)
        expect(await stakingRewards.balanceOf(accounts[2].address)).to.eq(0)

        // Can get the reward when paused
        const reward = await stakingRewards.rewards(accounts[2].address)
        await stakingRewards.connect(accounts[2]).getReward()
        expect(await clayToken.balanceOf(accounts[2].address)).to.eq(reward)
        expect(await stakingRewards.rewards(accounts[2].address)).to.eq(0)

        // Unpause the contract
        await stakingRewards.unpause()

    });
    // //todo: get user reward without calling withdraw function
    it('can exit', async function () {

        // Mint LP Tokens to Account 3
        expect(await sumeroLpToken.balanceOf(accounts[3].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[3].address, ethers.utils.parseUnits('4.0', 'ether'))
        const balance = await sumeroLpToken.balanceOf(accounts[3].address)
        expect(balance).to.equal(ethers.utils.parseEther("4.0"))

        // Give allowance to the StakingRewards Contract from Account 3
        const amount = ethers.utils.parseUnits('4.0', 'ether')
        await sumeroLpToken.connect(accounts[3]).approve(StakingRewardsAddress, amount)
        expect(await sumeroLpToken.allowance(accounts[3].address, StakingRewardsAddress)).to.eq(amount)

        // Staking LP Tokens from Account 3
        await stakingRewards.connect(accounts[3]).stake(amount)
        expect(await stakingRewards.balanceOf(accounts[3].address)).to.eq(amount)
        expect(await sumeroLpToken.balanceOf(accounts[3].address)).to.eq(0)
        expect(await clayToken.balanceOf(accounts[3].address)).to.eq(0)

        await stakingRewards.connect(accounts[3]).exit()

        // After exit, contract sends back lp tokens to the investor
        expect(await sumeroLpToken.balanceOf(accounts[3].address)).to.eq(amount)
        expect(await stakingRewards.balanceOf(accounts[3].address)).to.eq(0)
        expect(await stakingRewards.rewards(accounts[3].address)).to.eq(0)
        console.log("Clay Balance " + await clayToken.balanceOf(accounts[3].address))
        console.log("Clay reward balance: " + await clayToken.balanceOf(accounts[3].address))
    });

    it("should check earning for users where staking period is same", async () => {

        // Minting lp Tokens for account 5 and 6
        expect(await sumeroLpToken.balanceOf(accounts[5].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[5].address, ethers.utils.parseUnits('20.0', 'ether'))
        const balance5 = await sumeroLpToken.balanceOf(accounts[5].address)
        expect(balance5).to.equal(ethers.utils.parseUnits('20.0', 'ether'))
        expect(await sumeroLpToken.balanceOf(accounts[6].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[6].address, ethers.utils.parseUnits('20.0', 'ether'))
        const balance6 = await sumeroLpToken.balanceOf(accounts[6].address)
        expect(balance6).to.equal(ethers.utils.parseUnits('20.0', 'ether'))

        const approvalAmount = ethers.utils.parseUnits('20.0', 'ether')
        const amount = ethers.utils.parseUnits('20.0', 'ether')
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[5].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[5]).approve(StakingRewardsAddress, approvalAmount)
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[6].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[6]).approve(StakingRewardsAddress, approvalAmount)

        await expect(stakingRewards.connect(accounts[5]).stake(amount)).to.emit(stakingRewards, "Staked")
        await increaseTime(dayInMs/1000)
        await expect(stakingRewards.connect(accounts[5]).exit()).to.emit(stakingRewards, "Withdrawn")

        await expect(stakingRewards.connect(accounts[6]).stake(amount)).to.emit(stakingRewards, "Staked")
        await increaseTime(dayInMs/1000)
        await expect(stakingRewards.connect(accounts[6]).exit()).to.emit(stakingRewards, "Withdrawn")

        console.log(`earned account 5: ${BigNumber.from(await clayToken.balanceOf(accounts[5].address)).toString()}`)
        console.log(`earned account 6: ${BigNumber.from(await clayToken.balanceOf(accounts[6].address)).toString()}`)

        expect(BigNumber.from(await clayToken.balanceOf(accounts[5].address)).toString()).to.be.equal(BigNumber.from(await clayToken.balanceOf(accounts[6].address)).toString())
        await clayToken.connect(accounts[5]).transfer(accounts[1].address, await clayToken.balanceOf(accounts[5].address))
        await clayToken.connect(accounts[6]).transfer(accounts[1].address, await clayToken.balanceOf(accounts[6].address))
    })

    // In progress
    it("should check earning to be devided equally for same amount of token and same stake period", async () => {

        // Minting lp Tokens for account 7, for account 5,6 tokens already minted in above test
        expect(await sumeroLpToken.balanceOf(accounts[7].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[7].address, ethers.utils.parseUnits('20.0', 'ether'))
        const balance7 = await sumeroLpToken.balanceOf(accounts[7].address)
        expect(balance7).to.equal(ethers.utils.parseUnits('20.0', 'ether'))

        const approvalAmount = ethers.utils.parseUnits('20.0', 'ether')
        const amount = ethers.utils.parseUnits('20.0', 'ether')
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[5].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[5]).approve(StakingRewardsAddress, approvalAmount)
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[6].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[6]).approve(StakingRewardsAddress, approvalAmount)
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[7].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[7]).approve(StakingRewardsAddress, approvalAmount)

        await expect(stakingRewards.connect(accounts[5]).stake(amount)).to.emit(stakingRewards, "Staked")
        await increaseTime(dayInMs/1000)
        await expect(stakingRewards.connect(accounts[5]).exit()).to.emit(stakingRewards, "Withdrawn")

        await expect(stakingRewards.connect(accounts[6]).stake(amount)).to.emit(stakingRewards, "Staked")
        await expect(stakingRewards.connect(accounts[6]).stake(amount)).to.emit(stakingRewards, "Staked")
        // await increaseTime(dayInMs/1000)
        // await expect(stakingRewards.connect(accounts[6]).exit()).to.emit(stakingRewards, "Withdrawn")

        // console.log(`earned account 5: ${BigNumber.from(await clayToken.balanceOf(accounts[5].address)).toString()}`)
        // console.log(`earned account 6: ${BigNumber.from(await clayToken.balanceOf(accounts[6].address)).toString()}`)

        // expect(BigNumber.from(await clayToken.balanceOf(accounts[5].address)).toString()).to.be.equal(BigNumber.from(await clayToken.balanceOf(accounts[6].address)).toString())
    })



    it("should fail to stake after staking period is over", async ()=>{

        expect(await sumeroLpToken.balanceOf(accounts[4].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[4].address, ethers.utils.parseUnits('100.0', 'ether'))
        const balance = await sumeroLpToken.balanceOf(accounts[4].address)
        expect(balance).to.equal(ethers.utils.parseUnits('100.0', 'ether'))


        const approvalAmount = ethers.utils.parseUnits('40.0', 'ether')
        const amount = ethers.utils.parseUnits('20.0', 'ether')
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[4].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[4]).approve(StakingRewardsAddress, approvalAmount)
        await expect(stakingRewards.connect(accounts[4]).stake(amount)).to.emit(stakingRewards, "Staked")

        console.log("increamenting node time by 3 months");
        await increaseTime(dayInMs * 30 * 3 / 1000)
        expect(await sumeroLpToken.allowance(accounts[4].address, StakingRewardsAddress)).to.eq(amount)
        await expect(stakingRewards.connect(accounts[4]).stake(amount)).to.be.revertedWith('ClayStakingRewards: STAKING_PERIOD_OVER');

    })
});