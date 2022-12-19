//npx hardhat test test/003_staking_rewards_test.js

const { expect } = require("chai")
const { ethers } = require("hardhat")
const { BigNumber } = ethers
const hre = require("hardhat")
const { getEpochFromDate } = require("../utils/helper")

async function increaseTime(amount) {
    await hre.network.provider.send("evm_increaseTime", [amount])
    console.log("EVM time " + amount + " seconds increased!")
}

let clayToken;
let sumeroLpToken;
let stakingRewards;
let accounts;
let TokenAddress;
let LpTokenAddress;
let StakingRewardsAddress;

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
        const now = new Date()
        const expiry = getEpochFromDate(new Date(now.getTime() + 5184000000))
        const maxReward = BigNumber.from(10).pow(20);
        const StakingRewards = await hre.ethers.getContractFactory('ClayStakingRewards')
        stakingRewards = await StakingRewards.deploy(LpTokenAddress, TokenAddress, expiry, maxReward)
        StakingRewardsAddress = stakingRewards.address
        await stakingRewards.deployed()
        console.log("Staking Rewards contract deployed at: " + StakingRewardsAddress)
        console.log(`
        Reward rate: ${(await stakingRewards.rewardRate())}
        expiry: ${new Date((await stakingRewards.expiry()) * 1000 )}
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
        expect(await stakingRewards.rewardPerToken()).to.be.eq(0)
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
        let multiplier = ethers.BigNumber.from("1000000000000000000")
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
    //todo: get user reward without calling withdraw function
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
});