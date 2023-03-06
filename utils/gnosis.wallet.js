const WalletConnectProvider = require("@walletconnect/web3-provider");
const Safe = require("@safe-global/safe-core-sdk")
const EthersAdapter = require("@safe-global/safe-ethers-lib")
const colors = require('colors');

const getWallet = () => new Promise(async (resolve, reject) => {
    try {
        const goerliRpc = { 5: "https://eth-goerli.public.blastapi.io" }
        const qrcode = false;

        const walletConnectProvider = new WalletConnectProvider.default({
            rpc: {
                ...goerliRpc
            },
            qrcode
        });

        walletConnectProvider.connector.on("display_uri", (err, payload) => {
            const uri = payload.params[0];
            console.log(colors.blue("\n Wallet connect URI: " + uri));
        });

        // Subscribe to session connection
        walletConnectProvider.on("connect", async () => {
            const provider = new hre.ethers.providers.Web3Provider(
                walletConnectProvider
            );
            console.log("connected to gnosis");

            const ethersSigner = await provider.getSigner()

            const safe = await Safe.default.create({
                ethAdapter: new EthersAdapter.default({ ethers, ethersSigner }),
                safeAddress: "gor:0xd345b812f1b1674F28452d0999fEF2D608FeeB90"
            })

            resolve(safe);
        });

        await walletConnectProvider.enable();
    } catch (err) {
        reject(err)
    }

})



module.exports = {
    getWallet,
}