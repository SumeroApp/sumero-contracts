//npx hardhat test test/003_staking_rewards_test.js

const { expect } = require("chai")
const { ethers } = require("hardhat")
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { BigNumber, constants } = ethers
const hre = require("hardhat")
const { getEpochFromDate } = require("../utils/helper")

let clayToken;
let sumeroLpToken;
let stakingRewards;
let accounts;
let TokenAddress;
let LpTokenAddress;
let StakingRewardsAddress;
let rewardRate = BigNumber.from(0);
// let totalStakedSupply = BigNumber.from(0);
const multiplier = BigNumber.from(10).pow(18);
// let totalStakedSupplyAtTimestamp = {
//     "0": "0"
// }
// let userStakedBalaceAtTimestamp = {
//     "0": { "0x": "0" }
// }
// let timestamps = [];
const dayInMs = 60 * 60 * 24 * 1000;
const dayInS = 60 * 60 * 24;

const wait = (seconds) => new Promise((resolve) => {
    setTimeout(() => { resolve() }, seconds * 1000)
})

// const setUserStakedBalaceAtTimestamp = (timestamp, address, amount) => {
//     const temp = {}
//     temp[address] = String(amount)
//     userStakedBalaceAtTimestamp[timestamp] = temp
// }

const getTxTimestamp = tx => new Promise((resolve) => {
    tx.then(async tx => resolve((await ethers.provider.getBlock(tx.blockNumber)).timestamp))
})

// const calculateUserRewards = (account) => {
//     let userReward = BigNumber.from(0);
//     for (let i = 0; i < timestamps.length; i++) {
//         const t = timestamps[i]
        
//         if (timestamps[i + 1]) {
//             userReward = userReward.add(
//                 rewardRate
//                 .mul(BigNumber.from(timestamps[i + 1] - t - 1))
//                 .mul(userStakedBalaceAtTimestamp[t][String(account)])
//                     .div(BigNumber.from(totalStakedSupplyAtTimestamp[t]))
//             )
//         } else {
//             userReward = userReward.add(
//                 rewardRate.mul(userStakedBalaceAtTimestamp[t][String(account)])
//                     .div(BigNumber.from(totalStakedSupplyAtTimestamp[t]))
//             )
//         }
//         console.log({
//             time: t,
//             "l(u, t): ": userStakedBalaceAtTimestamp[t][String(account)],
//             "L(t): ": totalStakedSupplyAtTimestamp[t],
//             rewardRate: rewardRate.toString(),
//             userRewardNow: userReward.toString()
//         })
//     }
//     return userReward
// }

async function increaseTime(amount) {
    await hre.network.provider.request({
        method: 'evm_increaseTime',
        params: [amount],
    })
    await network.provider.send("evm_mine")
    console.log("EVM time " + amount + " milliseconds increased!")
}


describe("Staking Rewards Contract", function () {
    before('deploy contracts', async function () {
        // userStakedBalaceAtTimestamp = {}
        // totalStakedSupplyAtTimestamp = {}
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
        const SumeroLpToken = await hre.ethers.getContractFactory('SumeroLpToken')
        sumeroLpToken = await SumeroLpToken.deploy()
        await sumeroLpToken.deployed()
        LpTokenAddress = sumeroLpToken.address
        console.log("Staking Token contract deployed at: " + LpTokenAddress)

        // Deploy Staking Contract
        const blockNumber = await ethers.provider.getBlockNumber();
        const expiry = getEpochFromDate(new Date((await ethers.provider.getBlock(blockNumber)).timestamp * 1000 + dayInMs * 30 * 2))
        const maxReward = BigNumber.from(10).pow(20);
        const StakingRewards = await hre.ethers.getContractFactory('ClayStakingRewards')
        stakingRewards = await StakingRewards.deploy(LpTokenAddress, TokenAddress, BigNumber.from(expiry), maxReward)
        StakingRewardsAddress = stakingRewards.address
        await stakingRewards.deployed()
        console.log("Staking Rewards contract deployed at: " + StakingRewardsAddress)
        rewardRate = BigNumber.from(await stakingRewards.rewardRate());
        console.log(`
        Reward rate: ${(rewardRate.toString())}
        expiry: ${new Date((await stakingRewards.periodFinish()) * 1000)}
        `);

    });

    it('Gives minting access to staking contract', async function () {
        const roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"))
        await clayToken.grantRole(roleHash, StakingRewardsAddress)
        expect(await clayToken.hasRole(roleHash, StakingRewardsAddress)).eq(true)

    });

    it('Can update max reward', async function () {
        await expect(stakingRewards.connect(accounts[2]).updateMaxReward(BigNumber.from(10).pow(21))).to.be.reverted
        await expect(stakingRewards.updateMaxReward(BigNumber.from(10).pow(21))).to.emit(stakingRewards, "RewardRateUpdated")
        expect(await stakingRewards.maxReward()).to.eq(BigNumber.from(10).pow(21))
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
        let updatedRewardPerToken = ethers.BigNumber.from(BigNumber.from(rewardRate).mul(timestamp - lastUpdateTime).mul(multiplier).div(totalSupply))
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
    // // //todo: get user reward without calling withdraw function
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
        await increaseTime(dayInMs / 1000)
        await expect(stakingRewards.connect(accounts[5]).exit()).to.emit(stakingRewards, "Withdrawn")

        await expect(stakingRewards.connect(accounts[6]).stake(amount)).to.emit(stakingRewards, "Staked")
        await increaseTime(dayInMs / 1000)
        await expect(stakingRewards.connect(accounts[6]).exit()).to.emit(stakingRewards, "Withdrawn")

        console.log(`earned account 5: ${BigNumber.from(await clayToken.balanceOf(accounts[5].address)).toString()}`)
        console.log(`earned account 6: ${BigNumber.from(await clayToken.balanceOf(accounts[6].address)).toString()}`)

        expect(BigNumber.from(await clayToken.balanceOf(accounts[5].address)).toString()).to.be.equal(BigNumber.from(await clayToken.balanceOf(accounts[6].address)).toString())
    })

    // In progress
    it("should check earning to be devided equally for same amount of token and same stake period", async () => {

        // Minting lp Tokens for account 7, 8 and 9
        console.log(`totalSupply now: ${BigNumber.from(await stakingRewards.totalSupply()).toString()}`)
        console.log(`rewardPerTokenStored: ${BigNumber.from(await stakingRewards.rewardPerTokenStored()).toString()}`)
        expect(await sumeroLpToken.balanceOf(accounts[7].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[7].address, ethers.utils.parseUnits('20.0', 'ether'))
        const balance7 = await sumeroLpToken.balanceOf(accounts[7].address)
        expect(balance7).to.equal(ethers.utils.parseUnits('20.0', 'ether'))

        expect(await sumeroLpToken.balanceOf(accounts[8].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[8].address, ethers.utils.parseUnits('20.0', 'ether'))
        const balance8 = await sumeroLpToken.balanceOf(accounts[8].address)
        expect(balance8).to.equal(ethers.utils.parseUnits('20.0', 'ether'))

        expect(await sumeroLpToken.balanceOf(accounts[9].address)).to.equal(0)
        await sumeroLpToken.mint(accounts[9].address, ethers.utils.parseUnits('20.0', 'ether'))
        const balance9 = await sumeroLpToken.balanceOf(accounts[9].address)
        expect(balance9).to.equal(ethers.utils.parseUnits('20.0', 'ether'))

        const approvalAmount = ethers.utils.parseUnits('20.0', 'ether')
        const amount = ethers.utils.parseUnits('20.0', 'ether')
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[7].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[7]).approve(StakingRewardsAddress, approvalAmount)
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[8].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[8]).approve(StakingRewardsAddress, approvalAmount)
        expect(BigNumber.from(await sumeroLpToken.balanceOf(accounts[9].address)).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[9]).approve(StakingRewardsAddress, approvalAmount)

        //--------------------below contains the staking rewards calculation for an account staking for 1 day ------------------
        // this blocks data is going to be used to evaluate the test further down the line
        let tx = stakingRewards.connect(accounts[7]).stake(amount)
        await expect(tx).to.emit(stakingRewards, "Staked")
        let reward_amount_where_user_not_staked_or_reward_given = await stakingRewards.rewardPerToken()
        // let reward_amount_where_user_not_staked_or_reward_given = await stakingRewards.userRewardPerTokenPaid(accounts[7].address)

        const timestamp_on_stake_acc7 = await getTxTimestamp(tx);
   
        // increasing evm time by 1 day
        await time.setNextBlockTimestamp(timestamp_on_stake_acc7 + dayInS);

        
        const account_7_prev_earning = await clayToken.balanceOf(accounts[7].address);
        tx = stakingRewards.connect(accounts[7]).exit();
        // const timestamp_on_unstake_acc7 = await getTxTimestamp(tx);
        await expect(tx).to.emit(stakingRewards, "Withdrawn")
        let overall_rewards_generated = await stakingRewards.rewardPerToken()

        const account_7_earning = await clayToken.balanceOf(accounts[7].address);
        const acc_7_expected_reward = BigNumber.from(amount).mul(BigNumber.from(overall_rewards_generated).sub(reward_amount_where_user_not_staked_or_reward_given)).div(multiplier)

        
        console.log(`
        Account 7
        amount: ${amount}
        rewardRate: ${rewardRate}
        expected: ${acc_7_expected_reward}
        overall_rewards_generated: ${overall_rewards_generated}
        earned:   ${BigNumber.from(account_7_earning).sub(account_7_prev_earning)}
        error:   ${BigNumber.from(acc_7_expected_reward).sub(BigNumber.from(account_7_earning))}
        `)
        expect(acc_7_expected_reward).to.be.equal(BigNumber.from(account_7_earning).toString())
        //---------------------------------------------------------------------------------------------------------------------------

        // increasing evm time by 2 day
        // await time.setNextBlockTimestamp(timestamp_on_unstake_acc7 + 2 * dayInS);

        // tx = stakingRewards.connect(accounts[8]).stake(amount);
        // const timestamp_on_stake_acc8 = await getTxTimestamp(tx)
        // await expect(tx).to.emit(stakingRewards, "Staked")

        // await time.setNextBlockTimestamp(timestamp_on_stake_acc8 + 1);
        // tx = stakingRewards.connect(accounts[9]).stake(amount);
        // const timestamp_on_stake_acc9 = await getTxTimestamp(tx)
        // await expect(tx).to.emit(stakingRewards, "Staked")

        // await time.setNextBlockTimestamp(timestamp_on_stake_acc8 + dayInS);

        // tx = stakingRewards.connect(accounts[8]).exit()
        // const timestamp_on_unstake_acc8 = await getTxTimestamp(tx)
        // await expect(tx).to.emit(stakingRewards, "Withdrawn")

        // await time.setNextBlockTimestamp(timestamp_on_stake_acc9 + dayInS);
        // overall_rewards_generated = await stakingRewards.rewardPerToken()
        // const account_8_earning = await clayToken.balanceOf(accounts[8].address);

        // tx = stakingRewards.connect(accounts[9]).exit();
        // const timestamp_on_unstake_acc9 = await getTxTimestamp(tx);
        // await expect(tx).to.emit(stakingRewards, "Withdrawn")
        // overall_rewards_generated = await stakingRewards.rewardPerToken()
        

        
        // const account_9_earning = await clayToken.balanceOf(accounts[9].address);

        // console.log(`
        // Account 8
        // amount: ${amount.toString()}
        // staked: ${timestamp_on_stake_acc8}
        // unstaked: ${timestamp_on_unstake_acc8}
        // totalTime: ${timestamp_on_unstake_acc8 - timestamp_on_stake_acc8}
        // earned: ${BigNumber.from(account_8_earning).toString()}
        // `)
        // console.log(`
        // Account 9
        // amount: ${amount.toString()}
        // staked: ${timestamp_on_stake_acc9}
        // unstaked: ${timestamp_on_unstake_acc9}
        // totalTime: ${timestamp_on_unstake_acc9 - timestamp_on_stake_acc9}
        // earned: ${BigNumber.from(account_9_earning).toString()}
        // earned acc7 - (acc8 + acc9):, ${BigNumber.from(account_7_earning).sub(BigNumber.from(account_8_earning).add(account_9_earning)).toString()}
        // `)

        // expect(BigNumber.from(await clayToken.balanceOf(accounts[5].address)).toString()).to.be.equal(BigNumber.from(await clayToken.balanceOf(accounts[6].address)).toString())
    })



    it("should fail to stake after staking period is over", async () => {

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