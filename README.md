# sumero-contracts
This project contains the smart contracts and related deployment scripts.

## Project Setup

1. Install nvm (node version manager) https://github.com/nvm-sh/nvm

2. Install node version v16.14.0 via nvm.

`nvm install 16.14.0`

3. Install dependencies like truffle and ganache

```
pnpm install
```

When runnin commands below, make sure to enable the right version of node via `nvm use v16.14.0`.

## Things to Know Before Deploying Sumero

1. While deploying UniswapV2, change the init code hash in UniswapV2Library.sol according to the network and deployment.
    - Call the pairCodeHash() function in the factory after deployment to get the init code hash.
    - It uses type(UniswapV2Pair).creationCode to calculate the hash.

Read more about creationCode / initcode / bytecode in solidity / eth.

2. USD Coin has a decimal place of 6. Other ERC20 tokens usually have 18 decimal places.

3. Uniswap Error UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT. The liquidity maintained by pools is incorrect. // TODO

## Hardhat

1.  hardhat.config.js is the main configuration file

2. This command runs the hardhat network on *localhost*, compiles the contracts and runs the deployment scripts in the deploy folder using *hardhat-deploy* plugin.

        npx hardhat node

        npx hardhat clean (removes the artifacts file)

3. Compiles and stores build artifcats in ./artifcats

        npx hardhat compile

4. Gives access to hardhat console (similar to truffle console)

        npx hardhat console

5. Runs the given script in the specified network

        npx hardhat run --network localhost scripts/deploy.js
    

6. Deploy to a specified network using *hardhat-deploy* plugin

        npx hardhat deploy --network kovan

7. Variable HARDHAT_FORK in .env manages the forking details. If it's an empty string, hardhat network does not add any forking details to HRE. Otherwise it adds the forking network details at hre.config.networks.hardhat.forking . e.g. HARDHAT_FORK="kovan". running npx hardhat node would fork the "kovan" network and run locally, along with adding the forking details.

## Kovan Deployment Details
----

    kovan: {
        deployer: "0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7",
        CLAY_TOKEN: "0x64C597aBf737Ec2551dfbd3c492dA7da1Bf06a98",
        UNISWAP_FACTORY: "0xc88D40380C75231862776C61f67a77030A64946e",
        UNISWAP_ROUTER: "0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0",
        WETH: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
        USDC: "0xc2569dd7d0fd715b054fbf16e75b001e5c0c1115",
        USDC_CLAY_PAIR: "0x3Be8FaEc0E14f705Bbb0B3a453a7298a0B7DF4b8",
        UMA_EMP: "0xb94a77000651c3cb9cdf2c34f465e2260e8eeb77"
    }

Deployment addresses and parameters:

(*deployer is the address that deploys the contract*)

CLAY_TOKEN 
- deployer

UNISWAP_FACTORY
- deployer

UNISWAP_ROUTER
- deployer
- UNISWAP_FACTORY address
----

## Clay Token

Clay is the native token of Sumero. It is a ERC20 token, which can be used to interact with all aspects of sumero.

## Uniswap

For providing liquidty and creating a AMM we are using UniswapV2 contracts.

We use Uniswap router to interact with the uniswap Factory and create Pair contracts for each pair (for which we want to provide liquidity) e.g. Pair contracts for USDC-CLAY, USDC-zTSLA

## Synthetic Assets

We are using UMA as the backend to mint synthetic assets.

UMA provides us with following: 
1. An OO (Optimistic Oracle) for variable price discovery
2. A DVM (Data Verification Mechanism) used as a dispute resolution service.
3. Already deployed contracts to create additional synths (i.e. EMPC (Expiring Multi Party Creator) Contract)

We use `Expiring Multi Party Creator (EMPC) Contract` to create derivates i.e. `Expiring Multi Party (EMP) Contract` . These synths are also known as swaps since they are usually between 2 parties for a given currency and price. They expire at a certain time.

Steps to mint new synths: 

1. Deploy a new EMP contract with parameters to launch a `synth` using EMPC contract.
    - Call function creatExpiringMultiParty() on EMPC

    - Can call creatExpiringMultiParty() using either
        -  [community builder](syntheticbuilder.xyz)
        -  [launch-emp](https://github.com/UMAprotocol/launch-emp) repo (NOT WORKING!?)
        - Using our own hardhat script (TODO) 

    - Important Parameters
        - An approved collateral token (e.g. kovan USDC, mainnet WETH)
        - An approved price identifier (e.g. ethVIX/USDC). Therse are approved via UIMPs UMA Improvement Proposals
        - Minimum Collateral Amount

    - EMP contract is deployed along with a SyntheticToken Contract 
        - This is your actual synth, but is managed via EMP
        - Get SyntheticToken address from event `CreatedExpiringMultiParty` in transaction logs of EMPC's creatExpiringMultiParty()


2. Once an EMP contract has been deployed. Initial tokens can be minted by using the `create()` function on EMP contract. (https://docs.umaproject.org/build-walkthrough/minting-etherscan#checking-your-position)
    - Before calling create() function
        - Approve collateral for EMP contract
        - Calculate GCR (Global Collateralization Ratio) for 1st time minting
            - GCR = total Collateral / total tokens
            - GCR = (rawTotalPositionCollateral * cumulativeFeeMultiplier) / totalTokensOutstanding
        - calculate minimum no. of tokens (i.e. minSponorTokens)
        - calculate minimum no. of collateral (i.e. numOfTokensToMint * GCR = amountOfCollateral)
    - TODO: The create function mints synthetic tokens for a given amount of collateral!?? But need to understand the significance of GCR, Collateral, minSponsorTokens


Anyone can dispute a transaction on UMA's DVM. The DVM looks at historical prices of oracle that is disputed, and a voting mechanism decides if the dispute is correct or incorrect. That's why UMA calls it an optimistic oracle.

Expiring Synthetic Tokens - https://docs.umaproject.org/synthetic-tokens/expiring-synthetic-tokens

node index.js --gasprice 50 --mnemonic "acquire ship bacon pumpkin jazz poverty junk leader bean frown merry artist" --priceFeedIdentifier USDETH --collateralAddress "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" --expirationTimestamp "1650026236" --syntheticName "TEST Dollar [WETH Apr 2022]" --syntheticSymbol "TST-ETH-APR22" --minSponsorTokens "100"

## Scratch Pad
    web3.eth.sendTransaction({to:"0xC5E82E6b45609793da42aE8c1bb1B02FAb4f2514", from:accounts[0], value:web3.utils.toWei("3", "ether")})
    web3.eth.getBalance("0xC5E82E6b45609793da42aE8c1bb1B02FAb4f2514")

    const router = await UniswapV2Router02.deployed();
    <!-- getAmountOut(amountIn, reserveIn, reserveOut) -->
    (await router.getAmountOut('1000000000000000000', '1000000', '100000000000000000000')).toString();

    1 USDC to Clay Price
    (await router.getAmountOut('1000000', '1000000', '100000000000000000000')).toString();
    49924887330996494742
    49.924887330996494742

    1 Clay to USDC Price
    (await router.getAmountOut('1000000000000000000', '100000000000000000000', '1000000')).toString();
    9871
    0.009871

    const pair = await UniswapV2Pair.at("0x31f7207389158Fd1d4Be8229C4f52B6745E1BC87")
    const result = await pair.methods['getReserves()'].call({ from: "0xC5E82E6b45609793da42aE8c1bb1B02FAb4f2514" });

    CLAY
    console.log(result._reserve0.toString())
    100000000000000000000

    USDC
    console.log(result._reserve1.toString())
    1000000

    console.log(result._blockTimestampLast.toString())

    getAmountOut


    0x8d9656505a20c9562488bfa6ea0d1ef6b12966d7


    Nothing to compile
    Deployer address is: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    Clay Token Deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
    Clay Token Minted and Tested

    WETH ADDRESS: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

    USDC ADDRESS: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707

    FACTORY ADDRESS: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
    Duplicate definition of PairCreated (PairCreated(address,address,bytes,address,uint256), PairCreated(address,address,address,uint256))

    ROUTER ADDRESS: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
    INIT_CODE_HASH 0x731406021004244dac72ce242900a56e9adbdc067adee6d96205c455956168a1

    USDC_CLAY_PAIR: 0x19bD17b75F42E3011Eef02e35E71ba0a1bBdd7B7
    1000000000000000000
    1000000000000000000
    Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

    Accounts
    ========

    WARNING: These accounts, and their private keys, are publicly known.
    Any funds sent to them on Mainnet or any other live network WILL BE LOST.

    Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
    Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

    ///////
    const signer = await ethers.getSigner("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
    await signer.sendTransaction({to: "0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7",value: ethers.utils.parseEther("1.0")});