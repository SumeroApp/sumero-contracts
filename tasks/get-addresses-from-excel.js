// npx hardhat get-addresses-from-excel --input-file--path "./file.xlsx"
task("get-addresses-from-excel", "extracts addresses from excel file")
    .addParam(
        "inputFilePath",
        "Relative input file path, should be given if need to seed addresses from a file",
        undefined,
        types.string
    )
    .setAction(
        async (args) => {
            const fs = require('fs');

            const XLSX = require('xlsx');
            const colors = require('colors');

            const workbook = XLSX.readFile(args.inputFilePath);
            const sheetName = workbook.SheetNames[0];
            console.log("Sheet Name:", sheetName);
            const worksheet = workbook.Sheets[sheetName];
            const outputfilePath = './Airdrop_Array_Test_13thApril2023.json';

            // EXTRACTING THE VALUES
            console.log(colors.blue("\nExtracting Addresses "));

            const addresses = [];
            const improperAddresses = [];
            let start = 1;
            let end = 1503;
            for (let i = start; i < end; i++) {
                const address = worksheet[`H${i}`];
                if (address !== undefined && address !== null) {
                    if (!ethers.utils.isAddress(address.v)) {
                        improperAddresses.push(address.v);
                    }
                    else {
                        addresses.push(address.v);
                    }
                }

            }
            console.log(colors.green("\nExtracting Addresses Completed!"));
            console.log(colors.red("\nImproper Addresses: ", improperAddresses));

            console.log(colors.green("\nExporting Addresses!"));

            fs.writeFile(outputfilePath, JSON.stringify(addresses), (err) => {
                if (err) throw err;
            });
            console.log(colors.green("\nExporting Completed!"));
            console.log(colors.green("\Location: ", outputfilePath));
        }
    );


