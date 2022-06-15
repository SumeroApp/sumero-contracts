pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
    You can deposit CLAY (ERC20 token native to Sumero) to get zCLAY Bonds (a new ERC20 representing the bond).

    These zCLAY Bonds can be minted upto a year from depositStartDate.
    The bonds will mature after a period of 3 years from the depositStartDate.

    There is a "Fixed APY" (Annual Percentage Yield) of 40% on the zCLAY Bonds and a "Bonus APY" of additional 20% that is constantly decreasing as the deposit close date is nearing (i.e. from a maximum of 20% to 0%).
    In total giving a maximum of 60% APY if a user creates bonds at Day 1 of bond start date.

    - FIXED_APY = 40%
    - BONUS_APY = 20% (decreases as deposit close date nears)

    Example:

    - User deposits 1 Clay and issues a zCLAY Bond on Day 1 of bond start date
    - [(deposit close timestamp - block timestamp) / (1 year in seconds) * Bonus_APY]
    - Total APY = APY + Bonus APY = 60%
    - User get 2.8 zCLAY Bond (Total APY (60%) for next 3 years i.e 180% total interest)
    - 1 + (180% of 1) => 1 + 1.8 => 2.8
    
    The user can claim the zCLAY Bonds for equivalent value of CLAY after the maturation date.
    The user has to lock his CLAY in to zCLAY bonds for atleast 3 years. They are open to trade these bonds on a secondary market (i.e. via LP pools on Sumero)
 */
contract ClayBonds is ERC20("zClay Token", "zCLAY"), Ownable {
    using SafeMath for uint256;

    IERC20 public clay;

    uint256 public totalBondRewards;
    uint256 public maximumClayDeposits;
    uint256 public totalBondDeposits;

    uint256 public depositStartDate;
    uint256 public depositCloseDate;
    uint256 public maturationDate;

    uint256 public dailyYieldPercent;

    uint256 public constant APY_PERCENT = 40;
    uint256 public constant BONUS_APY_PERCENT = 20;
    uint256 public constant BONDS_ISSUANCE_PERIOD = 1 days * 365;

    event Issue(
        uint256 amount,
        uint256 daysLeftToMaturationDate,
        uint256 rewardPercent,
        uint256 reward
    );

    constructor(
        IERC20 _clay,
        uint256 _totalBondRewards,
        uint256 _maximumClayDeposits
    ) public {
        clay = _clay;
        totalBondRewards = _totalBondRewards;
        maximumClayDeposits = _maximumClayDeposits;
        depositStartDate = block.timestamp;

        // TODO: take into consideration leap year?

        // deposit close date is 1 year in future
        depositCloseDate = depositStartDate.add(BONDS_ISSUANCE_PERIOD);
        // maturation date of bond is 3 years in future
        maturationDate = depositStartDate.add(BONDS_ISSUANCE_PERIOD.mul(3));

        // calculate daily yield
        // APY details can be taken as constructor argument
        dailyYieldPercent = (APY_PERCENT.add(BONUS_APY_PERCENT))
            .mul(1 ether)
            .div(365);
    }

    function getDaysLeftToMaturationDate()
        public
        view
        returns (uint256 daysLeftToMaturationDate)
    {
        // calculate days remaining till maturation day
        daysLeftToMaturationDate = maturationDate.sub(block.timestamp).div(
            1 days
        );
    }

    function getRewardPercent()
        public
        view
        returns (uint256 rewardPercent)
    {
        // Total Percentage Reward => dailyYieldPercent * daysLeftToMaturationDate
        // adding 1 here to consider interest for the current ongoing day
        rewardPercent = dailyYieldPercent.mul(getDaysLeftToMaturationDate().add(1));
    }

    function getReward(uint256 _amount, uint256 _rewardPercent)
        public
        view
        returns (uint256 reward)
    {
        // bondAmount => amount + (total percentage reward * amount)
        reward = _amount.mul(_rewardPercent).div(100).div(1 ether);
    }

    /**
     * Issues a zCLAY Bond depending on the amount of CLAY deposited and the current APY which depends on the time elapsed since bond programme inception
     * @param _clayAmount The amount of CLAY deposited
     */
    function issue(uint256 _clayAmount)
        public
        returns (uint256 bondAmount)
    {
        require(_clayAmount > 100, "Clay Amount must be greater than 100 wei");
        require(
            block.timestamp >= depositStartDate &&
                block.timestamp < depositCloseDate,
            "Deposit closed"
        );

        uint256 daysLeftToMaturationDate = getDaysLeftToMaturationDate();
        uint256 rewardPercent = getRewardPercent();
        uint256 reward = getReward(_clayAmount, rewardPercent);

        bondAmount = _clayAmount.add(reward);

        clay.transferFrom(msg.sender, address(this), _clayAmount);
        _mint(msg.sender, bondAmount);

        totalBondDeposits = totalBondDeposits.add(bondAmount);
        require(
            totalBondDeposits < totalBondRewards,
            "Bond Reward Pool Reached"
        );
        require(
            clay.balanceOf(address(this)).add(_clayAmount) <
                maximumClayDeposits,
            "Maximum Bonds Deposit Limit Reached"
        );
        emit Issue(
            _clayAmount,
            daysLeftToMaturationDate,
            rewardPercent,
            reward
        );
    }

    /**
     * @dev Burns zClay and returns the underlying Clay tokens
     **/
    function claim() public {
        require(
            maturationDate <= block.timestamp,
            "Bond Maturity date not reached"
        );
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "Balance must be greater than zero");
        _burn(msg.sender, balance);
        clay.transfer(msg.sender, balance);
    }
}
