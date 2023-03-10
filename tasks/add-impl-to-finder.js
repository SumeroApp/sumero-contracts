// npx hardhat add-impl-to-finder --name <interface-name> --address <interface-address> --skip-if-implementation-exists --network <network-name>
// npx hardhat add-impl-to-finder --name Registry --address 0x9214454Ff30410a1558b8749Ab3FB0fD6F942539 --skip-if-implementation-exists --network goerli
task("add-impl-to-finder", "Adds assets to Asset Manager")
    .addParam("name", "The name of the interface")
    .addParam("address", "The address of the implementation")
    .addFlag("skipIfImplementationExists", "boolean value to skip changing implementation if it already exists")
    .addOptionalParam(
        "gnosisSafe",
        "Gnosis safe address, should be given if trasactions need to be submitted to gnosis",
        undefined,
        types.string
    )
    .setAction(
        async (args, hre) => {
            if (args.gnosisSafe && !ethers.utils.isAddress(args.gnosisSafe)) throw new Error("Invalid safe address")

            const colors = require('colors');
            const { getTxUrl, isZeroAddress } = require('../utils/helper');
            const { deployer } = await hre.getNamedAccounts();

            const finder = await hre.ethers.getContract("Finder", deployer);
            console.log(colors.green("\nFINDER CONTRACT ADDRESS:", finder.address));

            const bytes32Name = hre.ethers.utils.formatBytes32String(args.name);
            const existingInterfaceAddress = await finder.interfacesImplemented(bytes32Name);
            console.log(colors.green("\n current interface name (bytes32): ", bytes32Name));
            console.log(colors.green("\n current interface address: ", existingInterfaceAddress));


            if (isZeroAddress(existingInterfaceAddress) || !args.skipIfImplementationExists) {
                console.log(colors.green("\n adding new interface -> ", args.name));
                console.log(colors.green(" converted interface to bytes32 -> ", bytes32Name));
                console.log(colors.green(" implementation address -> ", args.address));

                const { gnosisSafe } = args;
                if (gnosisSafe) return submitTransactionToGnosisSafe(gnosisSafe, finder, 'changeImplementationAddress', bytes32Name, args.address);

                const tx = await finder.changeImplementationAddress(bytes32Name, args.address);
                await tx.wait()

                txUrl = getTxUrl(hre.deployments.getNetworkName(), tx.hash);
                if (txUrl != null) {
                    console.log(txUrl);
                }
            } else {
                console.log(colors.green("\n skipping since implementation exists"));
            }

        }
    );