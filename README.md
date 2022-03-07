# sumero-contracts
This project contains the smart contracts and related deployment scripts.

## Project Setup

1. Install dependencies like truffle and ganache
```
npm install
```

## Things to Know Before Deploying Sumero

1. While deploying UniswapV2, change the init code hash in UniswapV2Library.sol according to the network and deployment.
    - Call the pairCodeHash() function in the factory after deployment to get the init code hash.
    - It uses type(UniswapV2Pair).creationCode to calculate the hash.

Read more about creationCode / initcode / bytecode in solidity / eth.

2. USD Coin has a decimal place of 6. Other ERC20 tokens have 18 decimal places.

3. Uniswap Error UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT

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
