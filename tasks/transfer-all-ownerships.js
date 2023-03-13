// npx hardhat transfer-all-ownerships --emp <address> --sponsor <address> --network <network-name>

task("transfer-all-ownerships", "Transfer all ownership/admin roles to target eth address")
    .addParam("address", "Address of the intended new owner")
    .setAction(
        async (args, hre) => {
            const colors = require('colors');
            console.log(colors.bold("\n==> Transfer and renouncing all ownerships/admin roles to:" + args.address));

            await run("transfer-contract-ownership", {
                contract: "AssetManager",
                address: args.address,
            })

            await run("transfer-contract-ownership", {
                contract: "ClayBonds",
                address: args.address,
            })

            await run("transfer-contract-ownership", {
                contract: "ClayStakingRewards",
                address: args.address,
            })

            await run("transfer-clayToken-ownership", {
                role: "DEFAULT_ADMIN_ROLE",
                address: args.address,
            })
        }
    );