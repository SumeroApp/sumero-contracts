//npx hardhat test test/004_asset_manager_test.js --network hardhat
// Asset Status
// 0 - Closed,
// 1 - Paused,
// 2 - Open 
const { expect } = require("chai")
const { ethers } = require("hardhat")
const hre = require("hardhat")

let assetManager
let AssetManagerAddress

describe("Asset Manager Contract", function () {
    before('deploy contracts', async function () {

        accounts = await ethers.getSigners()

        console.log(
            "Deploying Clay token with the account:",
            accounts[0].address
        );

        console.log("Account 1 balance:", (await accounts[1].getBalance()).toString())

        // Deploy Asset Manager Contract
        const AssetManager = await hre.ethers.getContractFactory('AssetManager')
        assetManager = await AssetManager.deploy()
        await assetManager.deployed()
        AssetManagerAddress = assetManager.address
        console.log("Asset manager contract deployed at: " + AssetManagerAddress)
    });

    it('adds EMPs', async function () {
        const totalEMPBefore = await assetManager.totalEmpAssets()
        expect(totalEMPBefore).eq(0)

        const empAddresses = ["0x0ccaf8cb1c92aef64dd36ce1f3882d195180ad5c", "0x0ccaf8cb1c92aef64dd36ce1f3882d195180ad5d", "0x0ccaf8cb1c92aef64dd36ce1f3882d195180ad5f"]
        for (let index = 0; index < empAddresses.length; index++) {
            await assetManager.addEmp(empAddresses[index])

        }
        for (let index = 1; index <= empAddresses.length; index++) {
            console.log(await assetManager.idToVerifiedEmps(index))

        }
        const totalEMPAfter = await assetManager.totalEmpAssets()
        expect(empAddresses.length).eq(totalEMPAfter)

        expect((await assetManager.idToVerifiedEmps(1)).addr).eq(ethers.utils.getAddress(empAddresses[0]))
        expect((await assetManager.idToVerifiedEmps(2)).addr).eq(ethers.utils.getAddress(empAddresses[1]))
        expect((await assetManager.idToVerifiedEmps(3)).addr).eq(ethers.utils.getAddress(empAddresses[2]))
        expect(totalEMPBefore + empAddresses.length).eq(totalEMPAfter)
        console.log("STATUS")
        expect((await assetManager.idToVerifiedEmps(1)).status).eq(2)
        expect((await assetManager.idToVerifiedEmps(2)).status).eq(2)
        expect((await assetManager.idToVerifiedEmps(3)).status).eq(2)
    });

    it('pauses EMPs', async function () {
        const empId = 1
        expect((await assetManager.idToVerifiedEmps(empId)).status).eq(2)
        await assetManager.pauseEmp(empId)
        expect((await assetManager.idToVerifiedEmps(empId)).status).eq(1)
        await expect(assetManager.pauseEmp(empId)).to.be.reverted
    });

    it('unPauses EMPs', async function () {
        const empId = 1
        expect((await assetManager.idToVerifiedEmps(empId)).status).eq(1)
        await assetManager.unpauseEmp(empId)
        expect((await assetManager.idToVerifiedEmps(empId)).status).eq(2)
        await expect(assetManager.unpauseEmp(empId)).to.be.reverted
    });

    it('closes EMPs', async function () {
        const empId = 1
        await assetManager.closeEmp(empId)
        expect((await assetManager.idToVerifiedEmps(empId)).status).eq(0)
        await expect(assetManager.closeEmp(empId)).to.be.reverted
    });

    it('adds Swap Pair Assets', async function () {
        const totalSwapPairAssetsBefore = await assetManager.totalSwapPairAssets()
        const swapPairAddresses = ["0x0abcf8cb1c92aef64dd36ce1f3882d195180ad5c", "0x0dabf8cb1c92aef64dd36ce1f3882d195180ad5d", "0x0bedf8cb1c92aef64dd36ce1f3882d195180ad5f"]
        for (let index = 0; index < swapPairAddresses.length; index++) {
            await assetManager.addSwapPair(swapPairAddresses[index])

        }
        for (let index = 1; index <= swapPairAddresses.length; index++) {
            console.log(await assetManager.idToVerifiedSwapPairs(index))
        }
        const totalSwapPairAssetsAfter = await assetManager.totalSwapPairAssets()
        expect(swapPairAddresses.length).eq(totalSwapPairAssetsAfter)

        expect(totalSwapPairAssetsBefore + swapPairAddresses.length).eq(totalSwapPairAssetsAfter)
        expect((await assetManager.idToVerifiedSwapPairs(1)).addr).eq(ethers.utils.getAddress(swapPairAddresses[0]))
        expect((await assetManager.idToVerifiedSwapPairs(2)).addr).eq(ethers.utils.getAddress(swapPairAddresses[1]))

        expect((await assetManager.idToVerifiedSwapPairs(1)).status).eq(2)
        expect((await assetManager.idToVerifiedSwapPairs(2)).status).eq(2)
    });

    it('pauses Swap Pair Assets', async function () {
        const swapPairId = 1
        expect((await assetManager.idToVerifiedSwapPairs(swapPairId)).status).eq(2)
        await assetManager.pauseSwapPair(swapPairId)
        expect((await assetManager.idToVerifiedSwapPairs(swapPairId)).status).eq(1)
        await expect(assetManager.pauseSwapPair(swapPairId)).to.be.reverted
    });

    it('unPauses Swap Pair Assets', async function () {
        const swapPairId = 1
        expect((await assetManager.idToVerifiedSwapPairs(swapPairId)).status).eq(1)
        await assetManager.unpauseSwapPair(swapPairId)
        expect((await assetManager.idToVerifiedSwapPairs(swapPairId)).status).eq(2)
        await expect(assetManager.unpauseSwapPair(swapPairId)).to.be.reverted
    });

    it('closes Swap Pair Assets', async function () {
        const swapPairId = 1
        await assetManager.closeSwapPair(swapPairId)
        expect((await assetManager.idToVerifiedSwapPairs(swapPairId)).status).eq(0)
        await expect(assetManager.closeSwapPair(swapPairId)).to.be.reverted
    });

    it('adds Staking Reward Assets', async function () {
        const totalStakingRewardAssetsBefore = await assetManager.totalStakingRewardAssets()
        const stakingRewardAssetAddresses = ["0x0aaaf8cb1c92aef64dd36ce1f3882d195180ad5c", "0x0bbbf8cb1c92aef64dd36ce1f3882d195180ad5d", "0x0adef8cb1c92aef64dd36ce1f3882d195180ad5f", "0x0bedf8cb1c92aef64dd36ce1f3882d195180ad5f"]

        for (let index = 0; index < stakingRewardAssetAddresses.length; index++) {
            await assetManager.addStakingReward(stakingRewardAssetAddresses[index])

        }
        for (let index = 1; index <= stakingRewardAssetAddresses.length; index++) {
            console.log(await assetManager.idToVerifiedStakingRewards(index))
        }

        const totalStakingRewardAssetsAfter = await assetManager.totalStakingRewardAssets()

        expect(totalStakingRewardAssetsBefore + stakingRewardAssetAddresses.length).eq(totalStakingRewardAssetsAfter)
        expect((await assetManager.idToVerifiedStakingRewards(1)).addr).eq(ethers.utils.getAddress(stakingRewardAssetAddresses[0]))
        expect((await assetManager.idToVerifiedStakingRewards(2)).addr).eq(ethers.utils.getAddress(stakingRewardAssetAddresses[1]))
        expect((await assetManager.idToVerifiedStakingRewards(3)).addr).eq(ethers.utils.getAddress(stakingRewardAssetAddresses[2]))
        expect((await assetManager.idToVerifiedStakingRewards(4)).addr).eq(ethers.utils.getAddress(stakingRewardAssetAddresses[3]))


        expect((await assetManager.idToVerifiedStakingRewards(1)).status).eq(2)
        expect((await assetManager.idToVerifiedStakingRewards(2)).status).eq(2)
        expect((await assetManager.idToVerifiedStakingRewards(3)).status).eq(2)
        expect((await assetManager.idToVerifiedStakingRewards(4)).status).eq(2) 
    });

    it('pauses Staking Reward Assets', async function () {
        const stakingRewardId = 1
        expect((await assetManager.idToVerifiedStakingRewards(stakingRewardId)).status).eq(2)
        await assetManager.pauseStakingReward(stakingRewardId)
        expect((await assetManager.idToVerifiedStakingRewards(stakingRewardId)).status).eq(1)
        await expect(assetManager.pauseStakingReward(stakingRewardId)).to.be.reverted
    });

    it('unPauses Staking Reward Assets', async function () {
        const stakingRewardId = 1
        expect((await assetManager.idToVerifiedStakingRewards(stakingRewardId)).status).eq(1)
        await assetManager.unpauseStakingReward(stakingRewardId)
        expect((await assetManager.idToVerifiedStakingRewards(stakingRewardId)).status).eq(2)
        await expect(assetManager.unpauseStakingReward(stakingRewardId)).to.be.reverted
    });

    it('closes Staking Reward Assets', async function () {
        const stakingRewardId = 1
        await assetManager.closeStakingReward(stakingRewardId)
        expect((await assetManager.idToVerifiedStakingRewards(stakingRewardId)).status).eq(0)
        await expect(assetManager.closeStakingReward(stakingRewardId)).to.be.reverted
    });
});