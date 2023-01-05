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
let totalLpStaked = BigNumber.from(0);
let rewardRate = BigNumber.from(0);
const multiplier = BigNumber.from(10).pow(18);
const DAY = 60 * 60 * 24
const HOUR = 60 * 60
const YEAR = DAY * 365;

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
        const SumeroLpToken = await hre.ethers.getContractFactory('SumeroLpToken')
        sumeroLpToken = await SumeroLpToken.deploy()
        await sumeroLpToken.deployed()
        LpTokenAddress = sumeroLpToken.address
        console.log("Staking Token contract deployed at: " + LpTokenAddress)

        // Deploy Staking Contract
        const blockNumber = await ethers.provider.getBlockNumber();
        const expiry = getEpochFromDate(new Date((await ethers.provider.getBlock(blockNumber)).timestamp * 1000 + DAY * 1000 * 30 * 2))
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
        rewardRate = await stakingRewards.rewardRate();
    });

    it('Mints staking token to Account 1', async function () {
        expect(await getLpTokenBalance(accounts[1])).to.equal(0)
        await sumeroLpToken.mint(accounts[1].address, ethers.utils.parseUnits('10.0', 'ether'))
        const balance = await getLpTokenBalance(accounts[1])
        expect(balance).to.equal(ethers.utils.parseEther("10.0"))
    });

    it('Stakes LP token from Account 1', async function () {
        // expect(await stakingRewards.rewardPerToken()).to.be.eq(0)
        const amount = ethers.utils.parseUnits('10.0', 'ether')
        expect(await getLpTokenBalance(accounts[1])).to.equal(amount)
        await sumeroLpToken.connect(accounts[1]).approve(StakingRewardsAddress, amount)
        expect(await sumeroLpToken.allowance(accounts[1].address, StakingRewardsAddress)).to.eq(amount)
        await stakeAndReturnTimestamp(accounts[1], amount)
        expect(await getUserStakedBalance(accounts[1])).to.eq(amount)
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
        expect(await getLpTokenBalance(accounts[1])).to.eq(0)
        expect(await getUserStakedBalance(accounts[1])).to.eq(amount)
        await withdrawAndReturnTimestamp(accounts[1], amount);
        expect(await getUserStakedBalance(accounts[1])).to.eq(0)
        expect(await getLpTokenBalance(accounts[1])).to.eq(amount)
    });

    it('Gets staking rewards', async function () {
        const reward = await stakingRewards.rewards(accounts[1].address)
        await expect(stakingRewards.connect(accounts[1]).getReward()).to.emit(stakingRewards, "RewardPaid").withArgs(accounts[1].address, reward)
        expect(await getClayBalance(accounts[1])).to.eq(reward)
        expect(await stakingRewards.rewards(accounts[1].address)).to.eq(0)
    });

    it('Can pause the contract', async function () {
        // Owner: Account[0]
        await expect(stakingRewards.connect(accounts[1]).pause()).to.be.reverted
        await stakingRewards.pause()
        await expect(stakingRewards.connect(accounts[1]).unpause()).to.be.reverted

        // Mint Staking tokens to account 2
        expect(await getLpTokenBalance(accounts[2])).to.equal(0)
        await sumeroLpToken.mint(accounts[2].address, ethers.utils.parseUnits('6.0', 'ether'))
        const balance = await getLpTokenBalance(accounts[2])
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
        await stakeAndReturnTimestamp(accounts[2], amount);
        expect(await getUserStakedBalance(accounts[2])).to.eq(amount)

        // Pause the contract
        await stakingRewards.pause()

        // Can withdraw when paused
        expect(await getUserStakedBalance(accounts[2])).to.eq(amount)
        await withdrawAndReturnTimestamp(accounts[2], amount);
        expect(await getUserStakedBalance(accounts[2])).to.eq(0)

        // Can get the reward when paused
        const reward = await stakingRewards.rewards(accounts[2].address)
        await stakingRewards.connect(accounts[2]).getReward()
        expect(await getClayBalance(accounts[2])).to.eq(reward)
        expect(await stakingRewards.rewards(accounts[2].address)).to.eq(0)

        // Unpause the contract
        await stakingRewards.unpause()

    });
    it('can exit', async function () {

        const amount = ethers.utils.parseUnits('4.0', 'ether')
        // Mint LP Tokens to Account 3
        await mintLpTokens(amount, [accounts[3]]);
        // Give allowance to the StakingRewards Contract from Account 3
        await approveAllowances(amount, [accounts[3]]);

        // Staking LP Tokens from Account 3
        await stakeAndReturnTimestamp(accounts[3], amount)
        expect(await getUserStakedBalance(accounts[3])).to.eq(amount)
        expect(await getLpTokenBalance(accounts[3])).to.eq(0)
        expect(await getClayBalance(accounts[3])).to.eq(0)

        await exitAndReturnTimestamp(accounts[3], amount)

        // After exit, contract sends back lp tokens to the investor
        expect(await getLpTokenBalance(accounts[3])).to.eq(amount)
        expect(await getUserStakedBalance(accounts[3])).to.eq(0)
        expect(await stakingRewards.rewards(accounts[3].address)).to.eq(0)
        console.log("Clay Balance " + await getClayBalance(accounts[3]))
        console.log("Clay reward balance: " + await getClayBalance(accounts[3]))
    });

    it("account 5 and 6 earning same reward for same staking amount and same staking period", async () => {

        const approvalAmount = ethers.utils.parseUnits('20.0', 'ether')
        const amount = ethers.utils.parseUnits('20.0', 'ether')

        // Minting lp Tokens for account 5 and 6
        await mintLpTokens(amount, [accounts[5], accounts[6]]);

        await approveAllowances(approvalAmount, [accounts[5], accounts[6]]);

        await stakeAndReturnTimestamp(accounts[5], amount)
        await increaseTime(DAY)
        await exitAndReturnTimestamp(accounts[5], amount)

        await stakeAndReturnTimestamp(accounts[6], amount)
        await increaseTime(DAY)
        await exitAndReturnTimestamp(accounts[6], amount)

        console.log(`earned account 5: ${await getClayBalance(accounts[5])}`)
        console.log(`earned account 6: ${await getClayBalance(accounts[6])}`)

        expect((await getClayBalance(accounts[5])).toString()).to.be.equal((await getClayBalance(accounts[6])).toString())
    })

    it("account 7 earning is calculated correctly over 2 days", async () => {
        try {
            const accountList = [accounts[7], accounts[8], accounts[9]];
            const amount = ethers.utils.parseUnits('20.0', 'ether');
            await mintLpTokens(amount, accountList);
            await approveAllowances(amount, accountList);

            // stake from account 7
            const timestamp_on_stake_acc7 = await stakeAndReturnTimestamp(accounts[7], amount);
            // storing reward values for account 7
            let userRewardPerTokenPaid_account7 = await stakingRewards.rewardPerToken();

            // set next blocktimestamp 2 days in future
            await timeTravel(timestamp_on_stake_acc7 + (2 * DAY));

            const account7_clay_balance_before_unstake = await getClayBalance(accounts[7]);
            const account7_staked_lp_balance = await getUserStakedBalance(accounts[7]);
            console.log(`
                Account 7
                clay balance:                    ${account7_clay_balance_before_unstake}
                lp balance:                      ${account7_staked_lp_balance}
            `)

            // unstake from account 7 after 2 days, that's when the next block timestamp comes into play
            const timestamp_on_unstake_acc7 = await exitAndReturnTimestamp(accounts[7], amount);

            // ((_balances[accounts[7]] * (rewardPerToken() - userRewardPerTokenPaid[accounts[7]])) / multiplier ) + rewards[accounts[7])
            let expected_calculated_reward = ((BigNumber.from(account7_staked_lp_balance).mul(BigNumber.from(await stakingRewards.rewardPerToken()).sub(userRewardPerTokenPaid_account7))).div(multiplier)).add(BigNumber.from(0));

            // calculate earning for account 7 reward
            const account7_clay_balance_after_unstake = await getClayBalance(accounts[7]);
            const actual_reward = BigNumber.from(account7_clay_balance_after_unstake).sub(account7_clay_balance_before_unstake);


            console.log(`
                Account 7
                amount:                          ${amount}
                staked timestamp:                ${timestamp_on_stake_acc7}
                unstaked timestamp:              ${timestamp_on_unstake_acc7}
                stake duration:                  ${timestamp_on_unstake_acc7 - timestamp_on_stake_acc7}
                rewardRate:                      ${rewardRate}
                userRewardPerTokenPaid_account7: ${userRewardPerTokenPaid_account7}
                expected_calculated_reward:      ${expected_calculated_reward}
                actual_reward:                   ${actual_reward}
                error:                           ${BigNumber.from(expected_calculated_reward).sub(BigNumber.from(actual_reward))}
                `)

            expect(expected_calculated_reward).to.be.equal(BigNumber.from(actual_reward).toString())
        } catch (err) {
            console.log(err);
        }
    })

    it("account 8 and account 9 earning is calculated correctly over 1 day", async () => {
        try {

            const amount = ethers.utils.parseUnits('10.0', 'ether');

            // stake from account 8
            // timestamp is t
            const timestamp_on_stake_acc8 = await stakeAndReturnTimestamp(accounts[8], amount);
            // storing reward values for account 8
            let userRewardPerTokenPaid_account8 = await stakingRewards.rewardPerToken();

            // stake from account 9
            // timestamp is t + 1second
            const timestamp_on_stake_acc9 = await stakeAndReturnTimestamp(accounts[9], amount);
            // storing reward values for account 9
            let userRewardPerTokenPaid_account9 = await stakingRewards.rewardPerToken();

            // set next blocktimestamp 1 days in future
            await timeTravel(timestamp_on_stake_acc8 + (1 * DAY));

            const account8_clay_balance_before_unstake = await getClayBalance(accounts[8]);
            const account8_staked_lp_balance = await getUserStakedBalance(accounts[8]);
            const account9_clay_balance_before_unstake = await getClayBalance(accounts[9]);
            const account9_staked_lp_balance = await getUserStakedBalance(accounts[9]);
            console.log(`
                Account 8
                clay balance:                    ${account8_clay_balance_before_unstake}
                lp balance:                      ${account8_staked_lp_balance}

                Account 9
                clay balance:                    ${account9_clay_balance_before_unstake}
                lp balance:                      ${account9_staked_lp_balance}
            `)

            // unstake from account 8 after 1 day, that's when the next block timestamp comes into play
            // timestamp is t
            const timestamp_on_unstake_acc8 = await exitAndReturnTimestamp(accounts[8], amount);
            // ((_balances[accounts[8]] * (rewardPerToken() - userRewardPerTokenPaid[accounts[7]])) / multiplier ) + rewards[accounts[8])
            let expected_calculated_reward_acc8 = ((BigNumber.from(account8_staked_lp_balance).mul(BigNumber.from(await stakingRewards.rewardPerToken()).sub(userRewardPerTokenPaid_account8))).div(multiplier)).add(BigNumber.from(0));

            // unstake from account 9 after 1 day, that's when the next block timestamp comes into play
            // timestamp is t + 1second
            const timestamp_on_unstake_acc9 = await exitAndReturnTimestamp(accounts[9], amount);
            // ((_balances[accounts[8]] * (rewardPerToken() - userRewardPerTokenPaid[accounts[7]])) / multiplier ) + rewards[accounts[8])
            let expected_calculated_reward_acc9 = ((BigNumber.from(account9_staked_lp_balance).mul(BigNumber.from(await stakingRewards.rewardPerToken()).sub(userRewardPerTokenPaid_account9))).div(multiplier)).add(BigNumber.from(0));

            // calculate earning for account 8 reward
            const account8_clay_balance_after_unstake = await getClayBalance(accounts[8]);
            const account9_clay_balance_after_unstake = await getClayBalance(accounts[9]);
            const actual_reward_acc8 = BigNumber.from(account8_clay_balance_after_unstake).sub(account8_clay_balance_before_unstake);
            const actual_reward_acc9 = BigNumber.from(account9_clay_balance_after_unstake).sub(account9_clay_balance_before_unstake);


            console.log(`
                Account 8
                amount:                          ${amount}
                staked timestamp:                ${timestamp_on_stake_acc8}
                unstaked timestamp:              ${timestamp_on_unstake_acc8}
                stake duration:                  ${timestamp_on_unstake_acc8 - timestamp_on_stake_acc8}
                rewardRate:                      ${rewardRate}
                userRewardPerTokenPaid_account8: ${userRewardPerTokenPaid_account8}
                expected_calculated_reward:      ${expected_calculated_reward_acc8}
                actual_reward:                   ${actual_reward_acc8}
                error:                           ${BigNumber.from(expected_calculated_reward_acc8).sub(BigNumber.from(actual_reward_acc8))}

                Account 9
                amount:                          ${amount}
                staked timestamp:                ${timestamp_on_stake_acc9}
                unstaked timestamp:              ${timestamp_on_unstake_acc9}
                stake duration:                  ${timestamp_on_unstake_acc9 - timestamp_on_stake_acc9}
                rewardRate:                      ${rewardRate}
                userRewardPerTokenPaid_account9: ${userRewardPerTokenPaid_account9}
                expected_calculated_reward:      ${expected_calculated_reward_acc9}
                actual_reward:                   ${actual_reward_acc9}
                error:                           ${BigNumber.from(expected_calculated_reward_acc9).sub(BigNumber.from(actual_reward_acc9))}
                `)

            expect(expected_calculated_reward_acc8).to.be.equal(BigNumber.from(actual_reward_acc8).toString())
            expect(expected_calculated_reward_acc9).to.be.equal(BigNumber.from(actual_reward_acc9).toString())
        } catch (err) {
            console.log(err);
        }
    })

    it("check earning is according to stake amount and apy, when more than 1 staker", async () => {
        try {

            const accountList = [accounts[10], accounts[11]];
            const amount = ethers.utils.parseUnits('100.0', 'ether');
            await mintLpTokens(amount, accountList);
            await approveAllowances(amount, accountList);

            const tinyAmount = ethers.utils.parseUnits('0.00001', 'ether');
            const largeAmount = ethers.utils.parseUnits('100.0', 'ether');

            // stake tinyAmount from account 10
            const timestamp_on_stake_acc10 = await stakeAndReturnTimestamp(accounts[10], tinyAmount);
            // storing reward values for account 10
            let userRewardPerTokenPaid_account10 = await stakingRewards.rewardPerToken();
            const totalSupplyAfterStakeOf10 = await getTotalStakedLpVar();

            // stake largeAmount from account 11
            const timestamp_on_stake_acc11 = await stakeAndReturnTimestamp(accounts[11], largeAmount);
            const totalSupplyAfterStakeOf11 = await getTotalStakedLpVar();

            // calculating account 10 reward using apy function
            const acc10_apy_between_stakeOf10_stakeOf11 = await apy(tinyAmount, timestamp_on_stake_acc11, timestamp_on_stake_acc10, totalSupplyAfterStakeOf10);
            const acc10_duration_between_stake10_stake11 = BigNumber.from(timestamp_on_stake_acc11 - timestamp_on_stake_acc10);
            let acc10_amnt_as_per_apy = BigNumber.from(acc10_apy_between_stakeOf10_stakeOf11)
            // storing reward values for account 11
            let userRewardPerTokenPaid_account11 = await stakingRewards.rewardPerToken();

            // set next blocktimestamp 1 day in future
            await timeTravel(timestamp_on_stake_acc10 + (1 * DAY));

            const account10_clay_balance_before_unstake = await getClayBalance(accounts[10]);
            const account10_staked_lp_balance = await getUserStakedBalance(accounts[10]);
            const account11_clay_balance_before_unstake = await getClayBalance(accounts[11]);
            const account11_staked_lp_balance = await getUserStakedBalance(accounts[11]);

            console.log(`
                Account 10
                clay balance:                    ${account10_clay_balance_before_unstake}
                lp balance:                      ${account10_staked_lp_balance}

                Account 11
                clay balance:                    ${account11_clay_balance_before_unstake}
                lp balance:                      ${account11_staked_lp_balance}

                totalStakedSupply:               ${totalLpStaked}
            `)

            // unstake tinyAmount from account 10 after 1 day, that's when the next block timestamp comes into play
            const timestamp_on_unstake_acc10 = await exitAndReturnTimestamp(accounts[10], tinyAmount);
            // ((_balances[accounts[10]] * (rewardPerToken() - userRewardPerTokenPaid[accounts[11]])) / multiplier ) + rewards[accounts[10])
            let expected_calculated_reward_acc10 = ((BigNumber.from(account10_staked_lp_balance).mul(BigNumber.from(await stakingRewards.rewardPerToken()).sub(userRewardPerTokenPaid_account10))).div(multiplier)).add(BigNumber.from(0));
            const totalSupplyAfterUnStakeOf10 = await getTotalStakedLpVar();

            // calculating account 11 reward using apy function
            // stake 10, stake 11, unstake 10, unstake 11
            const acc11_apy_between_stakeOf11_unstakeOf10 = await apy(largeAmount, timestamp_on_unstake_acc10, timestamp_on_stake_acc11, totalSupplyAfterStakeOf11);
            const acc10_updated_apy_between_stakeOf11_unstake10 = await apy(tinyAmount, timestamp_on_unstake_acc10, timestamp_on_stake_acc11, totalSupplyAfterStakeOf11);
            // const acc10_duration_excluding_stake10_stake11 = BigNumber.from(timestamp_on_unstake_acc10 - timestamp_on_stake_acc10).sub(acc10_duration_between_stake10_stake11)
            acc10_amnt_as_per_apy = BigNumber.from(acc10_amnt_as_per_apy).add(acc10_updated_apy_between_stakeOf11_unstake10);

            // unstake largeAmount from account 11 after 1 day, that's when the next block timestamp comes into play
            const timestamp_on_unstake_acc11 = await exitAndReturnTimestamp(accounts[11], largeAmount);
            // ((_balances[accounts[11]] * (rewardPerToken() - userRewardPerTokenPaid[accounts[10]])) / multiplier ) + rewards[accounts[11])
            let expected_calculated_reward_acc11 = ((BigNumber.from(account11_staked_lp_balance).mul(BigNumber.from(await stakingRewards.rewardPerToken()).sub(userRewardPerTokenPaid_account11))).div(multiplier)).add(BigNumber.from(0));
            const totalSupplyAfterUnStakeOf11 = await getTotalStakedLpVar();

            const acc11_apy_between_unstakeOf11_unstakeOf10 = await apy(largeAmount, timestamp_on_unstake_acc11, timestamp_on_unstake_acc10, totalSupplyAfterUnStakeOf10);
            let acc11_amnt_as_per_apy = acc11_apy_between_stakeOf11_unstakeOf10.add(acc11_apy_between_unstakeOf11_unstakeOf10)


            // calculate earning for account 10 and account 11 reward
            const account10_clay_balance_after_unstake = await getClayBalance(accounts[10]);
            const account11_clay_balance_after_unstake = await getClayBalance(accounts[11]);
            const actual_reward_acc10 = BigNumber.from(account10_clay_balance_after_unstake).sub(account10_clay_balance_before_unstake);
            const actual_reward_acc11 = BigNumber.from(account11_clay_balance_after_unstake).sub(account11_clay_balance_before_unstake);


            console.log(`
                Account 10
                amount:                           ${tinyAmount}
                staked timestamp:                 ${timestamp_on_stake_acc10}
                unstaked timestamp:               ${timestamp_on_unstake_acc10}
                stake duration:                   ${timestamp_on_unstake_acc10 - timestamp_on_stake_acc10}
                rewardRate:                       ${rewardRate}
                userRewardPerTokenPaid_account10: ${userRewardPerTokenPaid_account10}
                expected_calculated_reward:       ${expected_calculated_reward_acc10}
                acc10_amnt_as_per_apy:            ${acc10_amnt_as_per_apy}
                actual_reward:                    ${actual_reward_acc10}
                error:                            ${BigNumber.from(expected_calculated_reward_acc10).sub(BigNumber.from(actual_reward_acc10))}

                Account 11
                amount:                           ${largeAmount}
                staked timestamp:                 ${timestamp_on_stake_acc11}
                unstaked timestamp:               ${timestamp_on_unstake_acc11}
                stake duration:                   ${timestamp_on_unstake_acc11 - timestamp_on_stake_acc11}
                rewardRate:                       ${rewardRate}
                userRewardPerTokenPaid_account11: ${userRewardPerTokenPaid_account11}
                expected_calculated_reward:       ${expected_calculated_reward_acc11}
                acc11_amnt_as_per_apy:            ${acc11_amnt_as_per_apy}
                actual_reward:                    ${actual_reward_acc11}
                error:                            ${BigNumber.from(expected_calculated_reward_acc11).sub(BigNumber.from(actual_reward_acc11))}
                `)

            expect(acc10_amnt_as_per_apy.toString()).to.be.equal(BigNumber.from(actual_reward_acc10).toString())
            expect(expected_calculated_reward_acc10).to.be.equal(BigNumber.from(actual_reward_acc10).toString())
            expect(acc11_amnt_as_per_apy.toString()).to.be.equal(BigNumber.from(actual_reward_acc11).toString())
            expect(expected_calculated_reward_acc11).to.be.equal(BigNumber.from(actual_reward_acc11).toString())
        } catch (err) {
            console.log(err);
        }
    })

    it("should fail to stake after staking period is over", async () => {
        const approvalAmount = ethers.utils.parseUnits('40.0', 'ether')
        const amount = ethers.utils.parseUnits('20.0', 'ether')

        await mintLpTokens(ethers.utils.parseUnits('100.0', 'ether'), [accounts[4]]);
        await approveAllowances(approvalAmount, [accounts[4]]);

        console.log("incrementing node time by 3 months");
        await increaseTime(DAY * 30 * 3)
        expect(await sumeroLpToken.allowance(accounts[4].address, StakingRewardsAddress)).to.eq(approvalAmount)
        await expect(stakingRewards.connect(accounts[4]).stake(amount)).to.be.revertedWith('ClayStakingRewards: STAKING_PERIOD_OVER');

    })
});

// helper functions
const stakes = {};
const unstakes = {};
const totalStaked = {};
const timestamps = [];

const getLpTokenBalance = account => sumeroLpToken.balanceOf(account.address)

const getUserStakedBalance = account => stakingRewards.balanceOf(account.address)

const getClayBalance = account => clayToken.balanceOf(account.address)

const timeTravel = timestamp => time.setNextBlockTimestamp(timestamp)

// rewardRate * durationInS * (userLpTokenStaked/totalSupply)
const apy = async (USER_STAKE, end, start, TOTAL_LP) => {
    const REWARD_RATE = await stakingRewards.rewardRate();

    const MAXIMUM_REWARD_GIVEN_OVER_GIVEN_TIMESTAMPS = BigNumber.from(REWARD_RATE).mul(BigNumber.from(end - start))

    const USER_APY = MAXIMUM_REWARD_GIVEN_OVER_GIVEN_TIMESTAMPS.mul(BigNumber.from(USER_STAKE))
        .div(BigNumber.from(TOTAL_LP))
    return USER_APY
}

const getTotalStakedLpVar = async () => {
    totalLpStaked = await stakingRewards.totalSupply();
    return totalLpStaked;
}

const getTxTimestamp = tx => new Promise((resolve) => {
    tx.then(async tx => resolve((await ethers.provider.getBlock(tx.blockNumber)).timestamp))
})

const mintLpTokens = async (amount, accounts) => {
    for (const i in accounts) {
        expect(await getLpTokenBalance(accounts[i])).to.equal(0)
        await sumeroLpToken.mint(accounts[i].address, amount)
        const currentBalance = await getLpTokenBalance(accounts[i])
        expect(currentBalance).to.equal(amount)
    }
}

const approveAllowances = async (approvalAmount, accounts) => {
    for (const i in accounts) {
        expect(BigNumber.from(await getLpTokenBalance(accounts[i])).gte(approvalAmount)).to.be.true;
        await sumeroLpToken.connect(accounts[i]).approve(StakingRewardsAddress, approvalAmount)
    }
}

const stakeAndReturnTimestamp = async (account, amount) => {
    const tx = stakingRewards.connect(account).stake(amount);
    await expect(tx).to.emit(stakingRewards, "Staked").withArgs(account.address, amount);
    await logEventsFromTx(tx);
    const t = await getTxTimestamp(tx);
    stakes[t] = BigNumber.from(amount)
    totalStaked[t] = BigNumber.from(totalStaked[t] || 0).add(BigNumber.from(amount))
    timestamps.push(t)
    return t;
}

const exitAndReturnTimestamp = async (account, amount, expectedReward = 0) => {
    const tx = stakingRewards.connect(account).exit();
    await expect(tx).to.emit(stakingRewards, "Withdrawn").withArgs(account.address, amount).to.emit(stakingRewards, "RewardPaid");
    if (expectedReward) await expect(tx).to.emit(stakingRewards, "RewardPaid").withArgs(account.address, expectedReward);
    await logEventsFromTx(tx);
    const t = await getTxTimestamp(tx);
    unstakes[t] = BigNumber.from(amount)
    totalStaked[t] = BigNumber.from(totalStaked[t] || 0).sub(BigNumber.from(amount))
    timestamps.push(t)
    return t;
}

const withdrawAndReturnTimestamp = async (account, amount) => {
    const tx = stakingRewards.connect(account).withdraw(amount);
    await expect(tx).to.emit(stakingRewards, "Withdrawn").withArgs(account.address, amount);
    await logEventsFromTx(tx);
    const t = await getTxTimestamp(tx);
    unstakes[t] = BigNumber.from(amount)
    totalStaked[t] = BigNumber.from(totalStaked[t] || 0).sub(BigNumber.from(amount))
    timestamps.push(t)
    return t;
}

const logEventsFromTx = async (tx) => {
    const resolveTxPromise = await tx;
    const receipt = await resolveTxPromise.wait();
    for (const eventObj of receipt.events) {
        if (eventObj && 'event' in eventObj) {
            console.log(`Event ${eventObj.event} with args ${eventObj.args}`);
        }
    }
}