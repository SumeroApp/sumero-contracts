// npx hardhat clay-claim --network <network-name>
task("clay-claim", "Claims Clay Token")
    .setAction(
        async (args, hre) => {
            const { deployer } = await hre.getNamedAccounts();
            const { ethers } = require("hardhat");
            const { getTxUrl } = require('../utils/helper');
            const colors = require('colors');

            const KECCAK256 = require('keccak256');
            const { MerkleTree } = require("merkletreejs");
            const addressList = require('../utils/addressList.json');

            const ClayDistributor = await ethers.getContract("ClayDistributor", deployer);
            console.log("Clay Distributor Contract Address: " + ClayDistributor.address);

            let leaves = [];

            for (const address in addressList) {
                if (ethers.utils.isAddress(address)) {
                    leaves.push(KECCAK256(address));
                }
                else {
                    console.log(colors.red("\nInvalid Address: ", address));
                    return;
                }

            }
            const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true })
            const root = tree.getHexRoot()

            // check if deployer account is eligible
            const leaf = KECCAK256(deployer)
            const proof = tree.getHexProof(leaf)
            const isClaimable = tree.verify(proof, leaf, root);
            console.log('Is claimable: ' + isClaimable)

            if (isClaimable) {
                console.log(colors.blue("\n Claiming Clay Tokens "));
                try {
                    const tx = await ClayDistributor.connect(deployer).claim(proof)
                    await tx.wait();
                    const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                    if (txUrl != null) {
                        console.log(txUrl);
                    }

                } catch (error) {
                    console.log(colors.red(deployer, "is not eligible to claim Clay token!"));
                    console.log(error);
                }
            }
        }
    );

module.exports = {};
