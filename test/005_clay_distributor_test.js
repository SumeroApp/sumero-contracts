//npx hardhat test ./test/005_clay_distributor_test.js
const { expect } = require("chai")
const { ethers } = require("hardhat")
const hre = require("hardhat")
const KECCAK256 = require('keccak256');
const { MerkleTree } = require("merkletreejs");

let clayToken;
let accounts;
let clayDistributor;
let DistributorAddress;
let TokenAddress;
let root;
let tree;
let dropAmountInWei;
let liveness;
let expirationTimestamp;
let owner;

async function increaseTime(amount) {
    await hre.network.provider.request({
        method: 'evm_increaseTime',
        params: [amount],
    })
    await network.provider.send("evm_mine")
    console.log("EVM time " + amount + " seconds increased!")
}

describe("Clay Distributor", function () {
    before('deploy Clay Token and Clay Distributor', async function () {

        accounts = await ethers.getSigners()

        console.log(
            "Deploying Clay token with the account:",
            accounts[0].address
        );
        const addresses = [
            accounts[0].address,
            accounts[1].address,
            accounts[2].address,
        ];
        console.log(addresses)

        console.log("Account 1 balance:", (await accounts[2].getBalance()).toString())


        // Deploy ClayToken
        const ClayToken = await hre.ethers.getContractFactory('ClayToken')
        clayToken = await ClayToken.deploy()
        TokenAddress = clayToken.address
        await clayToken.deployed()
        console.log("Clay Token contract deployed at: " + TokenAddress)

        // Build merkle tree
        const leaves = addresses.map(addr => KECCAK256(addr));
        tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true })
        root = tree.getHexRoot()
        dropAmountInWei = ethers.utils.parseUnits("100", 18);
        console.log('Merkle tree root: ', root)

        // Deploy ClayDistributor
        const ClayDistributor = await hre.ethers.getContractFactory('ClayDistributor')
        owner = accounts[5].address;
        const currentTimestamp = Date.now() / 1000;
        liveness = 600; // 10 minutes
        expirationTimestamp = Math.floor(currentTimestamp + liveness);
        clayDistributor = await ClayDistributor.deploy(TokenAddress, root, dropAmountInWei, expirationTimestamp, owner)
        DistributorAddress = clayDistributor.address;
        console.log("Clay Distributor contract deployed at: " + DistributorAddress)

    });

    it('Mints 300 CLAY to Distributor', async function () {
        const amount = ethers.utils.parseUnits('300.0', 'ether')
        expect(await clayToken.balanceOf(DistributorAddress)).to.equal(0)
        await clayToken.mint(DistributorAddress, amount)
        expect(await clayToken.balanceOf(DistributorAddress)).to.equal(amount)
    });

    it('Claims Clay Token', async function () {
        expect(await clayToken.balanceOf(accounts[0].address)).to.be.equal(0)
        const proof = tree.getHexProof(KECCAK256(accounts[0].address))
        await clayDistributor.connect(accounts[0]).claim(proof)
        expect(await clayToken.balanceOf(accounts[0].address)).to.be.equal(dropAmountInWei)

        expect(
            clayDistributor.connect(accounts[0]).claim(proof)
        ).to.be.revertedWith(
            'Already Claimed!'
        )

        expect(await clayToken.balanceOf(accounts[0].address)).to.be.equal(dropAmountInWei)
    });

    it('Handles invalid proof', async function () {
        expect(await clayToken.balanceOf(accounts[1].address)).to.be.equal(0)
        // valid proof would be obtained by accounts[1].address
        const proof = tree.getHexProof(KECCAK256(accounts[0].address))
        expect(
            clayDistributor.connect(accounts[1]).claim(proof)
        ).to.be.revertedWith(
            'Invalid Proof!'
        )
        expect(await clayToken.balanceOf(accounts[1].address)).to.be.equal(0)
    });

    it('Claims the remaining tokens after the expiration time ', async function () {
        // account 5 is owner
        expect(await clayToken.balanceOf(owner)).to.be.equal(0)
        await expect(clayDistributor.exit()).to.be.revertedWith("Airdrop period hasn't expired yet!")
        await increaseTime(600)

        // revert claim requests after the expiration
        const proof = tree.getHexProof(KECCAK256(accounts[2].address))
        await expect(clayDistributor.connect(accounts[2]).claim(proof)).to.be.revertedWith("Airdrop period has expired!")

        const remainingAmount = await clayToken.balanceOf(DistributorAddress);
        await clayDistributor.exit()
        expect(await clayToken.balanceOf(DistributorAddress)).to.be.equal(0)
        expect(await clayToken.balanceOf(owner)).to.be.equal(remainingAmount)
    });
});