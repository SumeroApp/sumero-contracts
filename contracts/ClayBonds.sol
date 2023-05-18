// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IClayToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
    You can deposit CLAY (ERC20 token native to Sumero) to get zCLAY Bonds (a new ERC20 representing the bond).

    These zCLAY Bonds can be minted upto 180 days from depositStartDate.
    The bonds will mature after a period of 2 years (i.e. 731 days, taking into account extra leap day for 2024) from the depositStartDate.

    There is a "APY" (Annual Percentage Yield) of 50% on the zCLAY Bonds that is constantly decreasing as the deposit 
    close date is nearing (i.e. from a maximum of 50% to 0%).

    Example:

    - User deposits 1 Clay and issues a zCLAY Bond on Day 1 of bond start date
    - [(deposit close timestamp - block timestamp) / (1 year in seconds) * APY]
    - User gets 2 zCLAY Bond (APY (50%) for next 2 years i.e 100% total interest)
    - 1 + (100% of 1) => 1 + 1 => 2
    
    The user can claim the zCLAY Bonds for equivalent value of CLAY after the maturation date.
    The user has to lock his CLAY in to zCLAY bonds for atleast 2 years. They are open to trade these bonds on a secondary market (i.e. via LP pools on Sumero)
 */
contract ClayBonds is ERC20("zClay Token", "zCLAY"), Ownable {
    IClayToken public clay;

    // the maximum upper limit of bond rewards that this contract will give over it's lifetime
    uint256 public immutable maximumBondRewards;
    // total zCLAY bonds locked into the contract
    uint256 public totalBondDeposits;

    uint256 public immutable depositStartDate;
    uint256 public immutable depositCloseDate;
    uint256 public immutable maturationDate;

    uint256 public immutable dailyYieldPercent;

    uint256 public constant APY_PERCENT = 50;

    uint256 public constant BONDS_ISSUANCE_PERIOD = 180 days;
    // Adding an extra day to account for extra day in leap year 2024
    uint256 public constant MATURATION_PERIOD = ((1 days * 365) * 2) + 1;

    // minimum staking amount must be 100 wei
    uint256 public constant MIN_ISSUANCE_AMOUNT = 100;

    constructor(IClayToken _clay, uint256 _maximumBondRewards) {
        require(address(_clay) != address(0), "ClayBonds: ZERO_ADDRESS");
        clay = _clay;
        maximumBondRewards = _maximumBondRewards;
        depositStartDate = block.timestamp;

        // deposit close date is 180 days in future
        depositCloseDate = block.timestamp + BONDS_ISSUANCE_PERIOD;
        // maturation date of bond is 2 years in future
        maturationDate = block.timestamp + MATURATION_PERIOD;

        // calculate daily yield
        // APY details can be taken as constructor argument
        dailyYieldPercent = (APY_PERCENT * (1 ether)) / 365;
    }

    function getDaysLeftToMaturationDate()
        public
        view
        returns (uint256 daysLeftToMaturationDate)
    {
        if (maturationDate < block.timestamp) {
            return 0; // just return 0 instead of dealing with negatives
        }
        // calculate days remaining till maturation day
        daysLeftToMaturationDate =
            (maturationDate - block.timestamp) /
            (1 days);
    }

    function getRewardPercent(uint256 daysLeftToMaturationDate)
        public
        view
        returns (uint256 rewardPercent)
    {
        // Total Percentage Reward => dailyYieldPercent * daysLeftToMaturationDate
        // adding 1 here to consider interest for the current ongoing day
        rewardPercent = dailyYieldPercent * (daysLeftToMaturationDate + 1);
    }

    function getReward(uint256 _amount, uint256 _rewardPercent)
        public
        pure
        returns (uint256 reward)
    {
        // bondAmount => amount + (total percentage reward * amount)
        reward = ((_amount * _rewardPercent) / 100) / 1 ether;
    }

    /**
     * Issues a zCLAY Bond depending on the amount of CLAY deposited and the current APY which depends on the time elapsed since bond programme inception
     * @param _clayAmount The amount of CLAY deposited
     */
    function issue(uint256 _clayAmount) external returns (uint256 bondAmount) {
        require(
            _clayAmount > MIN_ISSUANCE_AMOUNT,
            "ClayBonds: INSUFFICIENT_AMOUNT"
        );
        require(
            block.timestamp >= depositStartDate,
            "ClayBonds: DEPOSIT_NOT_YET_STARTED"
        );
        require(
            block.timestamp < depositCloseDate,
            "ClayBonds: DEPOSIT_CLOSED"
        );

        uint256 daysLeftToMaturationDate = getDaysLeftToMaturationDate();
        uint256 rewardPercent = getRewardPercent(daysLeftToMaturationDate);
        uint256 reward = getReward(_clayAmount, rewardPercent);

        bondAmount = _clayAmount + reward;

        bool success = clay.transferFrom(
            msg.sender,
            address(this),
            _clayAmount
        );
        require(success, "ClayBonds: TRANSFER_FAILED");
        _mint(msg.sender, bondAmount);

        totalBondDeposits = totalBondDeposits + bondAmount;

        require(
            totalBondDeposits <= maximumBondRewards,
            "ClayBonds: MAX_BOND_REWARD_POOL_REACHED"
        );

        emit Issued(
            msg.sender,
            _clayAmount,
            daysLeftToMaturationDate,
            rewardPercent,
            reward
        );
    }

    /**
     * @dev Burns zClay and returns the underlying Clay tokens
     **/
    function claim() external {
        require(
            maturationDate <= block.timestamp,
            "ClayBonds: BOND_NOT_MATURED"
        );
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "ClayBonds: BALANCE_IS_ZERO");
        _burn(msg.sender, balance);
        clay.mint(msg.sender, balance);
        emit Claimed(msg.sender, balance);
    }

    /**
     * @dev Burns the remaining Clay in the contract
     **/
    function burn() external onlyOwner {
        require(
            maturationDate <= block.timestamp,
            "ClayBonds: BOND_NOT_MATURED"
        );
        uint256 clayBalance = clay.balanceOf(address(this));
        clay.burn(address(this), clayBalance);
        emit Burned(clayBalance);
    }

    /* ========== EVENTS ========== */
    event Issued(
        address indexed user,
        uint256 amount,
        uint256 daysLeftToMaturationDate,
        uint256 rewardPercent,
        uint256 reward
    );
    event Claimed(address indexed user, uint256 balance);
    event Burned(uint256 amount);
}
