const { expect } = require("chai")
const { ethers } = require("hardhat")
const hre = require("hardhat")
const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");

let accounts;
let emp;
let expiringMultiPartyAddress;
const HOUR = 60 * 60
const DAY = HOUR * 24

describe("ExpiringMultiParty Contract", function () {
    before('deploy contracts', async function () {

        accounts = await ethers.getSigners()

        console.log(
            "Deploying ExpiringMultiParty with the account:",
            accounts[0].address,
            // hre.network
        );

        console.log("Account 1 balance:", (await accounts[2].getBalance()).toString())
        console.log("Running all deployments")
        await hre.deployments.fixture()

        const blockNumber = await ethers.provider.getBlockNumber();
        const expiry = Math.round(new Date((await ethers.provider.getBlock(blockNumber)).timestamp * 1000 + DAY * 1000 * 30 * 2).getTime() / 1000)

        // Deploy ExpiringMultiParty Contract
        expiringMultiPartyAddress = await hre.run("emp-create", {
            expirationTimestamp: String(expiry),
            withdrawalLiveness: '7200',
            liquidationLiveness: '7200',
            collateralAddress: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
            priceFeed: "NUMERICAL",
            ancillaryData: "0x73796e746849443a20226e6c687069222c20713a20436f6e76657274207072696365",
            synthName: "Netherlands House Price Index",
            synthSymbol: "cNLHPIv3",
            collateralRequirement: '1.2',
            disputeBond: '0.01',
            sponsorDisputeReward: '0.2',
            disputerDisputeReward: '0.7',
            minSponsorTokens: '2.3',
            ooReward: '100'
        })


        const EMP = await hre.ethers.getContractFactory("contracts/UMA/financial-templates/expiring-multiparty/ExpiringMultiParty.sol:ExpiringMultiParty");
        emp = EMP.attach(expiringMultiPartyAddress);

    });

    it('Should be able to transfer ownership to account[1]', async function () {
        let ownerAddress = await emp.owner()
        await ethers.provider.send("hardhat_impersonateAccount", [ownerAddress]);
        owner = await ethers.getSigner(ownerAddress);
        
        await expect(emp.connect(owner).transferOwnership(accounts[2].address)).to.emit(emp, 'OwnershipTransferred')
    });

    it('Account[2] should be able to call emergencyShutdown on active emp', async function () {
        const usdcTreasury = '0x75C0c372da875a4Fc78E8A37f58618a6D18904e8'
        await ethers.provider.send("hardhat_impersonateAccount", [usdcTreasury]);
        const usdcTreasurysigner = await ethers.getSigner(usdcTreasury);

        const usdc = await ethers.getContractAt(ERC20.abi, '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', usdcTreasurysigner);
        const transferTx = await usdc.transfer(accounts[2].address, '1000000000')
        await transferTx.wait()

        const transferTxForNextStep = await usdc.transfer(accounts[0].address, '1000000000')
        await transferTxForNextStep.wait()
        
        const allowanceTx = await usdc.connect(accounts[2]).approve(expiringMultiPartyAddress, '100000000')
        await allowanceTx.wait()

        await expect(emp.connect(accounts[2]).emergencyShutdown()).to.emit(emp, 'EmergencyShutdown')
    });

    it("should not be able to mint a position on emp after shutdown", async ()=>{

        expect(await hre.run('emp-mint', {
            empAddress: expiringMultiPartyAddress,
            collateralAmount: '800',
            additionalCollateralRatio: '0.25',
        })).to.throw

    })

});
100000