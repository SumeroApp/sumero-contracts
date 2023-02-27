// npx hardhat transfer-ownerships --emp <address> --sponsor <address> --network <network-name>

task("transfer-ownerships", "Transfer all ownership/admin roles to given eth address")
    .addParam("address", "Address of the intended owner")
    .setAction(
        async (args, hre) => {
            const colors = require('colors');
            console.log(colors.bold("\n==> Transfer and renouncing all ownerships/admin roles to:" + args.address));

            await run("ownership-transfer", {
                contract: "AssetManager",
                address: args.address,
            })

            await run("ownership-transfer", {
                contract: "ClayBonds",
                address: args.address,
            })

            await run("ownership-transfer", {
                contract: "ClayStakingRewards",
                address: args.address,
            })

            await run("transfer-clayToken-ownership", {
                role: "DEFAULT_ADMIN_ROLE",
                address: args.address,
            })
        }
    );