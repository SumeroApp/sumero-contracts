# sumero-contracts
This project contains the smart contracts and related deployment scripts.

## Project Setup

1. Install nvm (node version manager) https://github.com/nvm-sh/nvm

2. Install node version v16.14.0 via nvm.

```
nvm install 16.14.0
```

3. Install VSCode extensions - JuanBlanco.solidity

4. Setup VScode to use correct formatting
    - Create `settings.json` inside `.vscode` folder and add following
```
{
    "[solidity]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "JuanBlanco.solidity"
    },
    "[javascript]": {
        "editor.formatOnSave": true,
    },
}
```

5. Install pnpm globally

```
npm install -g pnpm@6.31.0
pnpm install
```

When running commands below, make sure to enable the right version of node via `nvm use v16.14.0`.

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

6. Deploy a particular contract to a specified network using tags

        npx hardhat deploy --network kovan --tags ClayBonds

7. Fork details ->
    Variable HARDHAT_FORK in .env manages the forking details. If it's an empty string, hardhat network does not add any forking details to HRE. Otherwise it adds the forking network details at hre.config.networks.hardhat.forking . e.g. HARDHAT_FORK="kovan". running npx hardhat node would fork the "kovan" network and run locally, along with adding the forking details.

    HARDHAT_FORK, ETH_NODE_URI_*networkname* and MNEMONIC_*networkname* need to be added for each forked network

## Sample Env File

    HARDHAT_FORK="goerli"
    ETH_NODE_URI_GOERLI="https://goerli.infura.io/v3/xxxx"
    MNEMONIC_GOERLI="random random random random random"

    APPROVED_EMPs='["0xc1eb9d0dfef93f0c81fd7eceb4f3cf0039e24f7e", "0xd63c91fd4fa5b3d843b5a104d505403e07908ba4"]'
    APPROVED_SWAP_PAIRs='[]'
    APPROVED_STAKING_REWARDs='[]'
    ETHERSCAN_API_KEY='9K49VNXGEATGF9MYU57MGAEEV952MEAYCD'

NOTE: Deployment scripts are to be used for deployment to Networks like Kovan, Ropsten, Mainnet etc. Make sure HARDHAT_FORK is pointing to correct network before deployment. Tests folder to be used for local testing before deployment.

## Kovan Deployment Details
----

    old_kovan: {
        deployer: "0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7",
        CLAY_TOKEN: "0x64C597aBf737Ec2551dfbd3c492dA7da1Bf06a98",
        UNISWAP_FACTORY: "0xc88D40380C75231862776C61f67a77030A64946e",
        UNISWAP_ROUTER: "0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0",
        WETH: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
        USDC: "0xc2569dd7d0fd715b054fbf16e75b001e5c0c1115",
        USDC_CLAY_PAIR: "0x3Be8FaEc0E14f705Bbb0B3a453a7298a0B7DF4b8",
        UMA_EMP: "0xb94a77000651c3cb9cdf2c34f465e2260e8eeb77",
        CLAY_BONDS: "0x40c5e2b5854565c9411AEA13c16D41B3E83396f0"
    }

    kovan: {
        deployer: "0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7",
        CLAY_TOKEN: "0xE0544883f42Dc1812528234ea8B2b7687d8FA38A",
        UNISWAP_FACTORY: "0xc88D40380C75231862776C61f67a77030A64946e",
        UNISWAP_ROUTER: "0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0",
        WETH: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
        USDC: "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede",
        ASSET_MANAGER: "0x06F2026d87F09344dF3F868C0b27dD6620fcFD16",
        UMA_EMP_CREATOR: "0x9a689BfD9f3a963b20d5ba4Ed7ed0b7bE16CfCcB",
        CLAY_BONDS: "0xc26eE6e643ae7554aeeF5bCff3e66798674c9FfF",
    }

    ASSET_MANAGER_ASSETS

    EMPs
    0x5405053DEa9e2A0e7F265D085C9a4A34C4E969a1
    0xf074dd25A248a7D329BaB6DDf37D8d588989078c

    SwapPairs
    0x995b62fC9681db170e5312229acF7250F91DF719

    StakingRewards
    0x7A16395c9566B4678B8f166bEcC2AbCae41f3DbC

## Verify Contracts on Etherscan

    npx hardhat verify --network kovan 0xc88D40380C75231862776C61f67a77030A64946e "0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7"

    npx hardhat verify  --network kovan 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0 "0xc88D40380C75231862776C61f67a77030A64946e" "0xd0A1E359811322d97991E03f863a0C30C2cF029C"

    npx hardhat verify  --network kovan 0x7A16395c9566B4678B8f166bEcC2AbCae41f3DbC "0xE0544883f42Dc1812528234ea8B2b7687d8FA38A" "0x995b62fC9681db170e5312229acF7250F91DF719"

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


## Asset Manager

Asset Manager Contract contains approved and verified assets by Sumero.

It has 3 types of assets
- EMPs (Expiring Multi Party)
- Swap Pairs (Uniswap Pairs)
- Staking Rewards

The asset can be either be in status Closed, Paused or Open.

The Sumero UI gets the verified assets by using this contract. It queries `idToVerifiedEmps`, `idToVerifiedSwapPairs` and `idToVerifiedStakingRewards` to get the asset details.