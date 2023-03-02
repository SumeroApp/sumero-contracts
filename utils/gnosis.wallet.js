const { setupSafeDeployer } = require("hardhat-safe-deployer");
const NodeWalletConnect = require("@walletconnect/node");
const WalletConnectProvider = require("@walletconnect/web3-provider");
const WalletConnectQRCodeModal = require("@walletconnect/qrcode-modal");

const getWallet = (ethers) => new Promise((resolve, reject) => {

    // Create connector
    const walletConnector = new NodeWalletConnect.default(
        {
            bridge: "https://bridge.walletconnect.org", // Required
        },
        {
            clientMeta: {
                description: "WalletConnect NodeJS Client",
                url: "https://nodejs.org/en/",
                icons: ["https://nodejs.org/static/images/logo.svg"],
                name: "WalletConnect",
            },
        }
    );


    // Check if connection is already established
    if (!walletConnector.connected) {
        // create new session
        walletConnector.createSession().then(() => {
            // get uri for QR Code modal
            const uri = walletConnector.uri;
            // display QR Code modal
            WalletConnectQRCodeModal.open(
                uri,
                () => {
                    console.log("QR Code Modal closed");
                },
                true // isNode = true
            );
        });
    }

    // Subscribe to connection events
    walletConnector.on("connect", async (error, payload) => {
        if (error) {
            reject(error);
        }

        console.log({
            payload: payload.params[0].accounts
        })

        // Close QR Code Modal
        WalletConnectQRCodeModal.close(
            true // isNode = true
        );

        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0];

        console.log({
            walletConnector
        })

        //  Wrap with Web3Provider from ethers.js
        const web3Provider = new ethers.providers.Web3Provider(walletConnector);

        const signer = await web3Provider.getSigner()

        resolve(signer)
    });
})

const getWallet1 = (ethers) => new Promise(async (resolve, reject) => {
    let bridge = "https://bridge.walletconnect.org";
    let goerliRpc = {5: "https://eth-goerli.public.blastapi.io"}
    let qrcode = false;
    // let onUri: SimpleFunction | null = null;

    const provider = new WalletConnectProvider.default({
        rpc: {
          ...goerliRpc
          // ...
        },
      }, qrcode);

      await provider.enable();

      const web3Provider = new ethers.providers.Web3Provider(provider);

      const signer = await web3Provider.getSigner()

      resolve(signer)
  })



module.exports = {
    getWallet,
    getWallet1
}