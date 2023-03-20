// npx hardhat build-merkle
task("build-merkle", "builds merkle tree for clay distribution")
    .setAction(
        async (args, hre) => {
            const colors = require('colors');
            const KECCAK256 = require('keccak256');
            const { MerkleTree } = require("merkletreejs");
            const XLSX = require('xlsx');

            const workbook = XLSX.readFile('../utils/airdrop.xlsx');
            const sheetName = workbook.SheetNames[0];
            console.log("Sheet Name:", sheetName);
            const worksheet = workbook.Sheets[sheetName];


            // EXTRACTING THE VALUES
            console.log(colors.blue("\nExtracting Addresses "));

            const addresses = [];
            const leaves = [];
            const impropperAddresses = [];
            let start = 5;
            let end = 1503;
            for (let i = start; i < end; i++) {
                const address = worksheet[`H${i}`];
                if (address !== undefined && address !== null) {
                    if (!ethers.utils.isAddress(address.v)) {
                        impropperAddresses.push(address.v);
                    }
                    else {
                        addresses.push(address.v);
                        leaves.push(KECCAK256(address.v))
                    }
                }

            }
            console.log(colors.green("\nExtracting Addresses Completed!"));
            console.log(colors.red("\nImproper Addresses: ", impropperAddresses));


            // BUILDING MERKLE TREE
            console.log(colors.blue("\nBuilding Merkle Tree "));

            const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true });
            const root = tree.getHexRoot();
            console.log(colors.green("\nMerkle Tree Built "));
            console.log("Merkle Root: " + root);

            // TESTING
            console.log(colors.blue("\nTesting with a random address "));

            const leaf = KECCAK256('0x356E25e6bF2D5f68684F5b758f644fbF02f6a782');
            const proof = tree.getProof(leaf);
            console.log('Is the address included in the leaves array:', tree.verify(proof, leaf, root));
        }
    );