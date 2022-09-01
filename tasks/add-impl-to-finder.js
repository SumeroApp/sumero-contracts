// npx hardhat add-impl-to-finder --name <interface-name> --address <interface-address> --skip-if-implmentation-exists --network <network-name>
// npx hardhat add-impl-to-finder --name x --address x --network goerli 
task("add-impl-to-finder", "Adds assets to Asset Manager")
    .addParam("name", "The name of the interface")
    .addParam("address", "The address of the implementation")
    .addParam("skipIfImplemenationExists", "boolean value to skip changing implementation if it already exists")
    .setAction(
        async (args, hre) => {
            const colors = require('colors');
            const { getTxUrl, isZeroAddress } = require('../utils/helper');
            const { deployer } = await hre.getNamedAccounts();

            const finder = await hre.ethers.getContract("Finder", deployer);
            console.log(colors.green("\nFINDER CONTRACT ADDRESS:", finder.address));

            // const name = "Registry";
            // const bytes32Name = hre.ethers.utils.formatBytes32String(name);
            // const address = "0x9214454Ff30410a1558b8749Ab3FB0fD6F942539";

            const existingInterfaceAddress = await finder.interfacesImplemented(bytes32Name);
            console.log(existingInterfaceAddress);

            if (isZeroAddress(existingInterfaceAddress) || args.skipIfImplemenationExists) {
                console.log(colors.green("\n current interface address: ", existingInterfaceAddress));

                console.log(colors.green("\n adding new interface -> ", name));
                console.log(colors.green(" converted interface to bytes32 -> ", bytes32Name));
                console.log(colors.green(" implementation address -> ", address));
                return;


                const tx = await finder.changeImplementationAddress(hre.ethers.utils.formatBytes32String(name), address);
                // emit InterfaceImplementationChanged(interfaceName, implementationAddress);

                txUrl = getTxUrl(hre.deployments.network, tx.hash);
                if (txUrl != null) {
                    console.log(txUrl);
                }
            }

        }
    );

    // npx hardhat add-impl-to-finder --name x --address x --skip-if-implmentation-exists true --network goerli