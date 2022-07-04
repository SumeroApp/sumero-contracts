/* StakingRewards Test Cases:
Test Stake, Unstake (withdraw)
Check balance of rewards after staking
Check rewardPerTokenStored
Withdraw all stake and test getReward function
Test pause / unpause */

const { expect } = require("chai")
const { ethers } = require("hardhat")
const hre = require("hardhat")

let clayToken;
let stakingToken;
let stakingRewards;
let accounts;
let TokenAddress;
let StakingTokenAddress;
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

        // Deploy LP Token Contract
        const StakingToken = await hre.ethers.getContractFactory('StakingToken')
        stakingToken = await StakingToken.deploy()
        await stakingToken.deployed()
        StakingTokenAddress = stakingToken.address
        console.log("Staking Token contract deployed at: " + StakingTokenAddress)

        // Deploy Staking Rewards Contract
        const StakingRewards = await hre.ethers.getContractFactory('ClayStakingRewards')
        stakingRewards = await StakingRewards.deploy(StakingTokenAddress, TokenAddress)
        StakingRewardsAddress = stakingRewards.address
        await stakingRewards.deployed()
        console.log("Staking Rewards contract deployed at: " + StakingRewardsAddress)

    });

    it('Gives minting access to staking contract', async function () {
        await clayToken.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", StakingRewardsAddress)
    });

    it('Can update reward rate', async function () {
        await expect(stakingRewards.connect(accounts[2]).updateRewardRate(20)).to.be.reverted
        await stakingRewards.updateRewardRate(20)
        expect(await stakingRewards.rewardRate()).to.eq(20)
    });

    it('Mints staking token to Account 1', async function () {
        expect(await stakingToken.balanceOf(accounts[1].address)).to.equal(0)
        await stakingToken.mint(accounts[1].address, ethers.utils.parseUnits('10.0', 'ether'))
        const balance = await stakingToken.balanceOf(accounts[1].address)
        expect(balance).to.equal(ethers.utils.parseEther("10.0"))
    });

    it('Stakes LP token from Account 1', async function () {
        expect(await stakingRewards.rewardPerToken()).to.be.eq(0)
        const amount = ethers.utils.parseUnits('10.0', 'ether')
        expect(await stakingToken.balanceOf(accounts[1].address)).to.equal(amount)
        await stakingToken.connect(accounts[1]).approve(StakingRewardsAddress, amount)
        expect(await stakingToken.allowance(accounts[1].address, StakingRewardsAddress)).to.eq(amount)
        await stakingRewards.connect(accounts[1]).stake(amount)
        expect(await stakingRewards.balanceOf(accounts[1].address)).to.eq(amount)

        const rewardRate = await stakingRewards.rewardRate()
        const lastUpdateTime = await stakingRewards.lastUpdateTime()
        const currentBlock = await ethers.provider.getBlockNumber()
        const timestamp = (await ethers.provider.getBlock(currentBlock)).timestamp
        const totalSupply = amount
        let multiplier = ethers.BigNumber.from("1000000000000000000")
        //rewardPerTokenStored + ((rewardRate * (block.timestamp - lastUpdateTime) * 1e18) / _totalSupply);
        let updatedRewardPerToken = ethers.BigNumber.from(rewardRate.mul(timestamp - lastUpdateTime).mul(multiplier).div(totalSupply))
        expect(await stakingRewards.rewardPerToken()).to.be.eq(updatedRewardPerToken)
    });

    it('Withdraws(Unstakes) LP tokens', async function () {
        const amount = ethers.utils.parseUnits('10.0', 'ether')
        expect(await stakingRewards.balanceOf(accounts[1].address)).to.eq(amount)
        await stakingRewards.connect(accounts[1]).withdraw(amount)
        expect(await stakingRewards.balanceOf(accounts[1].address)).to.eq(0)
    });

    it('Gets rewards', async function () {
        const reward = await stakingRewards.rewards(accounts[1].address)
        await stakingRewards.connect(accounts[1]).getReward()
        expect(await clayToken.balanceOf(accounts[1].address)).to.eq(reward)
        expect(await stakingRewards.rewards(accounts[1].address)).to.eq(0)
    });

    it('Can pause the contract', async function () {

        // Owner: Account[0]
        await expect(stakingRewards.connect(accounts[1]).pause()).to.be.reverted
        await stakingRewards.pause()
        await expect(stakingRewards.connect(accounts[1]).unpause()).to.be.reverted

        // Mint Staking tokens to account 2
        expect(await stakingToken.balanceOf(accounts[2].address)).to.equal(0)
        await stakingToken.mint(accounts[2].address, ethers.utils.parseUnits('10.0', 'ether'))
        const balance = await stakingToken.balanceOf(accounts[2].address)
        expect(balance).to.equal(ethers.utils.parseEther("10.0"))

        // Give allowance to the staking contract from account 2
        const amount = ethers.utils.parseUnits('6.0', 'ether')
        await stakingToken.connect(accounts[2]).approve(StakingRewardsAddress, amount)
        expect(await stakingToken.allowance(accounts[2].address, StakingRewardsAddress)).to.eq(amount)

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

    });
});