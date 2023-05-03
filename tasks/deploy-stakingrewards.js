// npx hardhat deploy-staking-rewards --slp-address <address> --synth-name <name> --expiration-timestamp <expiry> --network <network-name>
task("deploy-staking-rewards", "Deploy a new Stakking Rewards Contract")
    .addParam("slpAddress", "SLP token address")
    .addParam("synthName", "Name of the synth")
    .addParam("expirationTimestamp", "Expiration epoch timestamp for synth SLP staking pool")
    .addOptionalParam(
        "maxReward",
        "Max rewards to distribute over the staking period",
        undefined,
        types.string
    )
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if transactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            const { deployer } = await hre.getNamedAccounts();
            const { ethers } = require("hardhat");
            const { getTxUrl } = require('../utils/helper');

            let clayToken = await ethers.getContract("ClayToken", deployer);
            let clayStakingRewards = await ethers.getContractFactory("ClayStakingRewards", deployer);
            console.log("Clay Contract Address: " + clayToken.address);

            const getGnosisSigner = require('../gnosis/signer');
            if (args.gnosisSafe) {
                clayStakingRewards = clayStakingRewards.connect(await getGnosisSigner(args.gnosisSafe))
            }

            const deploymentArgs = [args.slpAddress,
            clayToken.address,
            args.expirationTimestamp,
            args.maxReward || ethers.utils.parseEther("16000000").toString()
            ]

            const ClayStakingRewards = await clayStakingRewards.deploy(...deploymentArgs);
            await ClayStakingRewards.deployed()
            const tx = await ClayStakingRewards.deployTransaction.wait()

            console.log("\nTransaction Receipt: \n", tx);
            const txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
            if (txUrl != null) {
                console.log(txUrl);
            }
            await createAbiJSON(clayStakingRewards, tx, args.synthName, deploymentArgs)
        }
    );

async function createAbiJSON(artifact, receipt, synthName, deploymentArgs) {
    const { writeFileSync } = require("fs");

    const deployedBytecode = await hre.ethers.provider.getCode(receipt.contractAddress)

    const data = {
        address: receipt.contractAddress,
        abi: JSON.parse(artifact.interface.format("json")),
        transactionHash: receipt.hash,
        receipt,
        args: deploymentArgs,
        bytecode: artifact.bytecode,
        deployedBytecode,
    };
    writeFileSync(`${__dirname}/../deployments/${hre.network.name}/ClayStakingRewards_${synthName}.json`, JSON.stringify(data));
}

module.exports = {};
