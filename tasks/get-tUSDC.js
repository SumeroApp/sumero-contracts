const USDC_MAINNET_TRESSURY = '0x7713974908be4bed47172370115e8b1219f4a5f0';

// npx hardhat get-tUSDC --token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 --to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --amount 1000000 --network localhost
task("get-tUSDC", "Approves ERC20 tokens to the given account")
    .addParam("token", "Token Address")
    .addParam("to", "The account's address")
    .addParam("amount", "The amount to be approved")
    .setAction(
        async (args, hre) => {
            const { getTxUrl } = require('../utils/helper');

            await ethers.provider.send("hardhat_impersonateAccount", [USDC_MAINNET_TRESSURY]);
            const usdcTreasurysigner = await ethers.getSigner(USDC_MAINNET_TRESSURY);


            console.log(`Collecting artifact`);
            const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");
            console.log(`Initialized contract`);
            const usdc = await ethers.getContractAt(ERC20.abi, args.token, usdcTreasurysigner);
            console.log("Getting USDC from tressury")
            try {
                const transferTx = await usdc.transfer(args.to, ethers.utils.parseUnits(args.amount, await usdc.decimals()))
                await transferTx.wait()
                const txUrl = getTxUrl(hre.deployments.getNetworkName(), transferTx.hash);
                if (txUrl != null) {
                    console.log(txUrl);
                }
                console.log(`Getting USDC token success...`);
            } catch (error) {
                console.log(`Getting USDC token failed...`);
                console.log(error);
            }
        }
    );



