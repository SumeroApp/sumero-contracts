
/**
 *  What all does the task need in order to do a successful initial mint?
 *  - Price of the identifier i.e. ETHUSD http://18.219.111.187/prices.json
 *  - Actual CR to use is max(rawGCR, position CR Ratio)
 *      - rawGCR => 0 => globalCR =>0 (this happens because totalTokensOutstanding is 0)
 *      - position CR Ratio => collateralRequirement + 0.15 i.e. 1.25 + 0.15 => 1.40 => 140%
 *  - minSponsorToken => 0.02 (20000/10^6(collateralDecimals))
 *  - Provide Either one of these
 *      - Optional Argument: Collateral provided
 *      - Optional Argument: NumOfTokens provided
 * 
 *  - You provide $1000 collateral
 *  - numOfTokens = collateralAmount / (price * CR ratio)
 *  - numOfTokens = 1000 / (1700*1.40) => 0.42
 * 
 *  - You provide numOfTokens e.g. 10 tokens
 *  - collateralNeeded = (price * CR ratio) * numOfTokens
 * */

/**
 *  What all does the task need in order to do successive mint?
 *  - Price of the identifier i.e. ETHUSD http://18.219.111.187/prices.json
 *  - Actual CR to use is max(globalCR, position CR Ratio)
 *      - rawGCR => totalTokensOutstandingUint.isZero() ? ethers.BigNumber.from(0) : totalPositionCollateralUint.mul(cumulativeFeeMultiplier).div(totalTokensOutstandingUint);
 *      - globalCR => formatEther(rawGCR)/price     
 *      - position CR Ratio => collateralRequirement + 15%
 * */
// npx hardhat mint-emp --emp-address <address> --collateral-amount <collateral-amount> --additional-collateral-ratio <additional collateral ratio (e.g. 0.15 => 15%)>
// npx hardhat mint-emp --emp-address 0x54fa5f6f19d2fee7071ac6aad970bf1497cdfcfe --collateral-amount 1000 --additional-collateral-ratio 0.15
task("mint-emp", "Mint the EMP")
    .addParam("empAddress", "Deployed EMP contract address")
    .addParam("collateralAmount", "The number of collateral tokens to collateralize the position with")
    .addParam("additionalCollateralRatio", "Additional collateral ratio (e.g. 0.15)")
    .setAction(
        async (args, deployments) => {
            const { expect } = require('chai');
            const { deployer } = await getNamedAccounts();
            const { ethers } = require("hardhat")
            const { getTxUrl } = require('../utils/helper');
            const fetch = require('node-fetch');

            const signer0 = ethers.provider.getSigner(deployer);
            const KOVAN_USDC = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede';
            const KOVAN_NETWORK_ID = 42

            //---- Get EMP Contract--------------------
            const { ExpiringMultiPartyCreatorEthers__factory, ExpiringMultiPartyEthers__factory, getAbi, getAddress } = require('@uma/contracts-node');
            const UMA_EMPC_ADDRESS = await getAddress("ExpiringMultiPartyCreator", KOVAN_NETWORK_ID);
            const empInstance = ExpiringMultiPartyEthers__factory.connect(args.empAddress, signer0);
            const emp_creator_instance = ExpiringMultiPartyCreatorEthers__factory.connect(UMA_EMPC_ADDRESS, signer0);
            const syntheticDecimals = await emp_creator_instance._getSyntheticDecimals(KOVAN_USDC);

            //----- Fetch Price-------------------------
            const fetchUrl = "http://18.219.111.187/prices.json"
            const priceIdentifier = (ethers.utils.parseBytes32String(await empInstance.priceIdentifier())).toLowerCase()

            const responseData = await fetch(fetchUrl)
                .then((response) => {
                    return response.json()
                })
            const price = responseData[priceIdentifier]
            console.log(priceIdentifier + ": " + price)


            //---- Calculations--------------------
            const collateralRequirement = await empInstance.collateralRequirement()
            console.log("collateralRequirement: " + ethers.utils.formatEther(collateralRequirement))
            const additionalCollateralRatio = ethers.utils.parseUnits(args.additionalCollateralRatio, "ether")
            console.log("additionalCollateralRatio: " + ethers.utils.formatEther(additionalCollateralRatio))
            const minSponsorToken = ethers.utils.formatUnits(await empInstance.minSponsorTokens(), syntheticDecimals)
            console.log("minSponsorToken: " + minSponsorToken)
            const positionCrRatio = ethers.BigNumber.from(collateralRequirement).add(additionalCollateralRatio)
            console.log("positionCrRatio: " + ethers.utils.formatEther(positionCrRatio))
            const totalTokensOutstandingUint = ethers.BigNumber.from(await empInstance.totalTokensOutstanding())
            console.log("totalTokensOutstanding: " + totalTokensOutstandingUint)
            const cumulativeFeeMultiplier = ethers.BigNumber.from(await empInstance.cumulativeFeeMultiplier())
            console.log("cumulativeFeeMultiplier: " + ethers.utils.formatEther(cumulativeFeeMultiplier))
            const totalPositionCollateralUint = ethers.BigNumber.from(await empInstance.rawTotalPositionCollateral())
            console.log("totalPositionCollateral: " + totalPositionCollateralUint)
            const rawGCR = totalTokensOutstandingUint.isZero() ? ethers.BigNumber.from(0) : totalPositionCollateralUint.mul(cumulativeFeeMultiplier).div(totalTokensOutstandingUint)
            const globalCR = (ethers.utils.formatUnits(rawGCR, 18)) / price
            console.log("globalCR: " + globalCR)
            console.log("rawGCR: " + ethers.utils.formatEther(rawGCR))
            const actualCR = Math.max(Number(globalCR), Number(ethers.utils.formatEther(positionCrRatio)))
            console.log("ActualCR: " + actualCR)

            const numOfTokens = args.collateralAmount / (price * globalCR)
            console.log("numOfTokens: " + numOfTokens)
            // takes the first 6 digits after the decimal, but also rounds the number!
            const fixedNumOfTokens = (numOfTokens.toFixed(6))
            console.log("fixedNumOfTokens:" + fixedNumOfTokens)

            const collateralAmountObject = { rawValue: ethers.utils.parseUnits((args.collateralAmount).toString(), syntheticDecimals) }
            const numTokensObject = { rawValue: ethers.utils.parseUnits(fixedNumOfTokens.toString(), syntheticDecimals) }
            expect(Number(fixedNumOfTokens)).to.be.gt(Number(minSponsorToken), "Not enough collateral amount!")

            
            //---- Approve EMP contract to spend collateral--------------------
            // const usdcInstance = new ethers.Contract(KOVAN_USDC, faucetTokenAbi, signer0)
            // await usdcInstance.allocateTo(deployer, ethers.utils.parseUnits(collateralAmount.toString(), syntheticDecimals))
            // await usdcInstance.approve(empAddress, ethers.utils.parseUnits(collateralAmount.toString(), syntheticDecimals)) 
            
            let mintEmpTx
            let txUrl
            try {
                mintEmpTx = await empInstance.create(collateralAmountObject, numTokensObject)
                await mintEmpTx.wait()
                txUrl = getTxUrl(deployments.network, mintEmpTx.hash)
            } catch (error) {
                console.log(error)
            }

            console.log("\nTransaction Receipt: \n", mintEmpTx)
            if (txUrl != null) {
                console.log(txUrl)
            }

        }
    );

module.exports = {};

