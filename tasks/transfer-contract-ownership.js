// npx hardhat transfer-contract-ownership --address <address> --contract <contract> --network <network>

// npx hardhat transfer-contract-ownership --address 0xD934fbEd3CB5dAa5A82C14089cAcaD6035718163 --contract ClayBonds --network dashboard

task("transfer-contract-ownership", "Transfers ownership of specified contract to the target address")
    .addParam("address", "The address of the target wallet/contract")
    .addParam("contract", "The name of the contract whose ownership is being transferred")
    .setAction(
        async (args, hre) => {
            const { deployer } = await hre.getNamedAccounts();
            const { expect } = require('chai');
            const colors = require('colors');
            console.log(colors.blue(`\nTransfering ${args.contract}'s ownerhship to: ${args.address}`));

            const ownableContract = await ethers.getContract(args.contract, deployer);

            console.log(` Current owner: ${await ownableContract.owner()}`)

            const tx = await ownableContract.transferOwnership(args.address)
            await tx.wait()

            expect(await ownableContract.owner()).to.be.eq(args.address, "Something went wrong while transfering ownership...")

            console.log(`Successfully transferred ${args.contract}'s at ${ownableContract.address} ownership to: ${args.address}`);
        }
    );
