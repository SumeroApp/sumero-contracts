// npx hardhat build-merkle
task("build-merkle", "builds merkle tree for clay distribution")
    .addOptionalParam(
        "inputFilePath",
        "Relative input file path, should be given if need to seed addresses from a file",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const colors = require('colors');
            const KECCAK256 = require('keccak256');
            const { MerkleTree } = require("merkletreejs");

            let addresses = [];
            let leaves = [];
            if (args.inputFilePath) {
                addresses = require(args.inputFilePath);
            } else {
                addresses = getAddresses();
            }

            leaves = addresses.map(address => KECCAK256(address));

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

            // TESTING 2
            console.log(colors.blue("\nTesting with another address "));

            const leaf2 = KECCAK256('0xB957C7591bf8b8ad1e5B8942dE6FF3b1D22d4951');
            const proof2 = tree.getProof(leaf2);
            console.log('Is the address included in the leaves array:', tree.verify(proof2, leaf2, root));
        }
    );

function getAddresses() {
    return ["0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0", "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"]
}
