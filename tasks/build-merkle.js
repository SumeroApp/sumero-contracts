// npx hardhat build-merkle
task("build-merkle", "builds merkle tree for clay distribution")
    .setAction(
        async (args, hre) => {
            const KECCAK256 = require('keccak256');
            const { MerkleTree } = require("merkletreejs");
            const addressList = require('../utils/addressList.json');
            const colors = require('colors');

            let leaves = [];
            console.log(colors.blue("\nBuilding Merkle Tree "));

            for (const address in addressList) {
                if (ethers.utils.isAddress(address)) {
                    leaves.push(KECCAK256(address));
                }
                else {
                    console.log(colors.red("\nInvalid Address: ", address));
                    return;
                }

            }
            const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true });
            const root = tree.getHexRoot();

            console.log(colors.green("\nMerkle Tree Built "));
            console.log(tree.toString());
            console.log("Merkle Root: " + root);

            // test
            /*          const leaf = KECCAK256('0xB9CcDD7Bedb7157798e10Ff06C7F10e0F37C6BdD');
                        const proof = tree.getProof(leaf);
                        console.log('proof: ', proof);
                        console.log('Result:', tree.verify(proof, leaf, root)); */
        }
    );
