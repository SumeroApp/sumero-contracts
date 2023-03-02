const WalletConnectProvider = require("@walletconnect/web3-provider");
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
        walletConnectProvider.on("connect", () => {
            const provider = new hre.ethers.providers.Web3Provider(
                walletConnectProvider
            );
            console.log("connected to gnosis");
            resolve(provider.getSigner());
        });

        await walletConnectProvider.enable();
    } catch (err) {
        reject(err)
    }

})



module.exports = {
    getWallet,
}