// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IClayToken.sol";

/**
    User can stake Sumero LP Tokens (received by providing liquidity to a Liquidity Pool on Sumero) to earn CLAY rewards.
    User can unstake the Sumero LP tokens and claim rewards at any point in time.
    Rewards would depend on your
    - time period of stake  
    - percentage of your staked tokens with respect to total staked tokens

    Owner of this contract can perform following actions:
    - pause / unpause this contract in case of closure of Staking Rewards scheme or other unforseen circumstances
    - change reward rate
 */
contract ClayStakingRewards is Ownable, ReentrancyGuard, Pausable {
    IClayToken public immutable clayToken;
    // Staking token would be Sumero LP tokens
    IERC20 public immutable stakingToken;

    // Reward Rate per day
    // 10 gwei CLAY per second
    // 10 gwei * (24 * 60 * 60)
    // 10 gwei * 86400
    // 864000 gwei => 0.000864 CLAY per day per token
    // Make this a max deterministic reward so that we can control outflow of CLAY?

    // reward rate i.e. reward in wei rewarded per second for staking a whole token
    uint256 public rewardRate = 10 gwei;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public expiry; // Contract lifetime.
    uint256 public maxReward; // Max reward that this contract will emit during it's lifetime.
    uint256 public rewardsEmitted;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    constructor(
        address _stakedToken,
        address _clayToken,
        uint256 _expiry,
        uint256 _maxReward
    ) {
        stakingToken = IERC20(_stakedToken);
        clayToken = IClayToken(_clayToken);
        expiry = _expiry;
        maxReward = _maxReward;
        rewardRate = _maxReward / (_expiry - block.timestamp);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        if (expiry < block.timestamp) {
            return
                rewardPerTokenStored +
                ((rewardRate * (expiry - lastUpdateTime) * 1e18) /
                    _totalSupply);
        }
        return
            rewardPerTokenStored +
            ((rewardRate * (block.timestamp - lastUpdateTime) * 1e18) /
                _totalSupply);
    }

    function earned(address _account) public view returns (uint256) {
        return
            ((_balances[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        if (block.timestamp > expiry) {
            lastUpdateTime = block.timestamp;
        } else {
            lastUpdateTime = block.timestamp;
        }

        rewards[_account] = earned(_account);
        userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        _;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(
        uint256 _amount
    ) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(
            expiry > block.timestamp,
            "ClayStakingRewards: STAKING_PERIOD_OVER"
        );
        require(_amount > 0, "ClayStakingRewards: AMOUNT_IS_ZERO");
        _totalSupply += _amount;
        _balances[msg.sender] += _amount;
        bool success = stakingToken.transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(success, "ClayStakingRewards: TRANSFER_FAILED");
        emit Staked(msg.sender, _amount);
    }

    function withdraw(
        uint256 _amount
    ) public nonReentrant updateReward(msg.sender) {
        require(_amount > 0, "ClayStakingRewards: AMOUNT_IS_ZERO");
        require(
            _amount <= _balances[msg.sender],
            "ClayStakingRewards: INSUFFICIENT_BALANCE"
        );

        _totalSupply -= _amount;
        _balances[msg.sender] -= _amount;
        bool success = stakingToken.transfer(msg.sender, _amount);
        require(success, "ClayStakingRewards: TRANSFER_FAILED");
        emit Withdrawn(msg.sender, _amount);
    }

    function exit() external {
        withdraw(_balances[msg.sender]);
        getReward();
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        rewardsEmitted += reward;
        rewards[msg.sender] = 0;
        // Sumero Owner needs to grant MINTER_ROLE for CLAY to StakingRewards
        clayToken.mint(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    /* ========== EVENTS ========== */

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 rewardRate);
}
