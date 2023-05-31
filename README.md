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

6. Install truffle globally - https://trufflesuite.com/docs/truffle/how-to/install/

When running commands below, make sure to enable the right version of node via `nvm use v16.14.0`.

## Deploying Sumero Contracts

Document on How to Deploy Sumero? - https://globalaccesslabs.quip.com/WfKjATOLADOw/Deployment-Guide-Smart-Contracts

Things to keep in mind:
Currently optimizer is set to 20 runs, which makes the deployment go through (it's a cheaper deploy for us), but users would have to pay more for when interacting with the contract (expensive for them).

    This means it is a trade-off parameter between code size (deploy cost) and code execution cost (cost after deployment). A “runs” parameter of “1” will produce short but expensive code. In contrast, a larger “runs” parameter will produce longer but more gas efficient code.

## Deploying Sumero Contracts with Gnosis Safe

Make sure the environment variables DEPLOYER_SAFE have the address of gnosis safe and SAFE_SERVICE_URL has the corresponding [service url](https://docs.safe.global/learn/safe-core/safe-core-api/available-services)

With the deployment script command append "--config hardhat.safe.config.js", this will config gnosis safe and let's you deploy using Safe.

## Hardhat

1. hardhat.config.js is the main configuration file

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

6. Test the contracts and store the gas report in [gas-report.txt](./gas-report.txt)

        npx hardhat test

7. Runs truffle dashboard. Opens a web page at http://localhost:24012 which allows us to Sign Transactions via Metamask

        truffle dashboard

8. Fork details ->
    Variable HARDHAT_FORK in .env manages the forking details. If it's an empty string, hardhat network does not add any forking details to HRE. Otherwise it adds the forking network details at hre.config.networks.hardhat.forking . e.g. HARDHAT_FORK="kovan". running npx hardhat node would fork the "kovan" network and run locally, along with adding the forking details.

    HARDHAT_FORK, ETH_NODE_URI_*networkname* and MNEMONIC_*networkname* need to be added for each forked network

## Sample Env File

    HARDHAT_FORK="goerli"
    ETH_NODE_URI_GOERLI="https://goerli.infura.io/v3/xxxx" 
    // ETH_NODE_URI_<NETWORK_NAME>
    MNEMONIC_GOERLI="random random random random random"
    // MNEMONIC_<NETWORK_NAME>

    APPROVED_EMPs='["0xc1eb9d0dfef93f0c81fd7eceb4f3cf0039e24f7e", "0xd63c91fd4fa5b3d843b5a104d505403e07908ba4"]'
    APPROVED_SWAP_PAIRs='[]'
    APPROVED_STAKING_REWARDs='[]'
    ETHERSCAN_API_KEY='9K49VNXGEATGF9MYU57MGAEEV952MEAYCD'
    COINMARKETCAP_API_KEY="SAMPLE-KEY"

NOTE: Deployment scripts are to be used for deployment to Networks like Kovan, Ropsten, Mainnet etc. Make sure HARDHAT_FORK is pointing to correct network before deployment. Tests folder to be used for local testing before deployment.

## Deployment Details

You'll find all deployment details on quip [here](https://globalaccesslabs.quip.com/IXnROEyJUmOC/Deployment-Details)

## Verify Contracts on Etherscan

    npx hardhat verify --network kovan 0xc88D40380C75231862776C61f67a77030A64946e "0x8D9656505A20C9562488bfa6EA0d1eF6B12966d7"

    npx hardhat verify  --network kovan 0xF502CBB71AB6C41E5B93640d4fF2f6945490C7a0 "0xc88D40380C75231862776C61f67a77030A64946e" "0xd0A1E359811322d97991E03f863a0C30C2cF029C"

    npx hardhat verify  --network kovan 0x7A16395c9566B4678B8f166bEcC2AbCae41f3DbC "0xE0544883f42Dc1812528234ea8B2b7687d8FA38A" "0x995b62fC9681db170e5312229acF7250F91DF719"

    npx hardhat verify --network goerli 0xF28887a69aC368A1b76c3D81cdd876acc4211a06 "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e" "0x6F9db85C1661769514Ab750547E29651B26e2D47" "0xE35256fb9adc9421F4d2246219AeA99B9F946B5c"

    EMPC Verification
    npx hardhat verify 0xC5830Fa3786F48D60846Add7505F3E69aCC29C6e "0xE60dBa66B85E10E7Fd18a67a6859E241A243950e" "0x6F9db85C1661769514Ab750547E29651B26e2D47" --network goerli

    npx hardhat --network goerli  etherscan-verify 

## Flatten Contracts

    npx hardhat flatten ./contracts/ClayToken.sol > TestClayToken.sol  

## Contracts deployed by UMA

kovan -> https://github.com/UMAprotocol/protocol/blob/master/packages/core/networks/42.json

goerli -> https://github.com/UMAprotocol/protocol/blob/master/packages/core/networks/5.json

AddressWhitelist -> check whitelisted tokens / collateral by UMA

add registry contract to Finder
Use UMA's Finder which points to UMA's registry code

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

Look at this doc on how to create new synths - https://globalaccesslabs.quip.com/XpQcA36SBxoe/Creating-a-Novel-Synthetic-Asset-using-the-NUMERICAL-identifier

How to deploy EMPC and EMP contracts? - https://globalaccesslabs.quip.com/WfKjATOLADOw/Deployment-Guide-Smart-Contracts#temp:C:OAQf38e5c0e0ff941b0b240e49c8

EMP Tasks:
1. [emp-create.js](./tasks/emp-create.js) - Deploys a new EMP contract
2. [emp-mint.js](./tasks/emp-mint.js) - Mints (opens a new sponsor position) for a given EMP
3. [emp-expire.js](./tasks/emp-expire.js) - Expires an EMP
4. [emp-settle.js](./tasks/emp-settle.js) - Settle's expired EMP

## Asset Manager

Asset Manager Contract contains approved and verified assets by Sumero.

It has 3 types of assets
- EMPs (Expiring Multi Party)
- Swap Pairs (Uniswap Pairs)
- Staking Rewards

The asset can be either be in status Closed, Paused or Open.

The Sumero UI gets the verified assets by using this contract. It queries `idToVerifiedEmps`, `idToVerifiedSwapPairs` and `idToVerifiedStakingRewards` to get the asset details.

## Steps for generating UML Diagrams
1- Install “Solidity Visual Developer” extension in VSCode
2- Open the contract file, click the uml button at the top
3- Copy everything in the @startuml file
4- Go to “http://www.plantuml.com/plantuml/uml/”,paste the copied content and submit
5- After generating the UML diagram you can download the image via right-click -> save image as