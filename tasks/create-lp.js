//npx hardhat create-lp --token1 <token1-address> --token2 <token2-address>  --network <network-name>
task("create-lp", "Creates liquidity pools in Uniswap")
    .addParam("token1", "Address of the first token")
    .addParam("token2", "Address of the second token")
    .setAction(
        async (args, deployments) => {
            const { expect } = require('chai');
            const { deployer } = await hre.getNamedAccounts();
            const { getTxUrl, getAddressUrl } = require('../utils/helper');
            let factory = await ethers.getContract("UniswapV2Factory", deployer)
            let router = await ethers.getContract("UniswapV2Router02", deployer)

            // Create Pair
            try {
                let pairAddress = await factory.getPair(args.token1, args.token2)
                console.log("\nPair address from factory: " + pairAddress)
                let PAIR;

                // token2 <=> token1 PAIR
                if (pairAddress == 0x0000000000000000000000000000000000000000) {
                    console.log("Creating the pair...");
                    const tx = await factory.createPair(args.token2, args.token1);
                    tx.wait();

                    PAIR = await router.getPair(args.token2, args.token1);
                    console.log(args.token1 + " - " + args.token2 + " created on: ", PAIR);

                    expect(await factory.getPair(args.token1, args.token2)).to.equal(PAIR, args.token2 + " - " + args.token1 + " not matching with what's there in factory");

                    pairAddress = await factory.getPair(args.token1, args.token2);
                    const pairUrl = getAddressUrl(deployments.network, pairAddress);
                    console.log("\nTransaction Receipt: \n", tx)

                    const txUrl = getTxUrl(deployments.network, tx.hash);
                    if (txUrl != null) {
                        console.log(txUrl)
                        console.log(pairUrl)
                    }
                }
                else {
                    console.log(args.token1 + " - " + args.token2 + " Pair already exists! ")
                    const pairUrl = getAddressUrl(deployments.network, pairAddress)
                    console.log(pairUrl)
                }
            } catch (error) {
                console.log("Issue when adding" + args.token2 + " - " + args.token1 + " Pair to Uniswap Pool")
                console.log(error);
            }
        }
    );

module.exports = {};
