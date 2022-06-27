// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IERC20 {
    // ERC20 Optional Views
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    // Views
    function totalSupply() external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    // Mutative functions
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract StakingRewards {
    // Would the reward token be CLAY?
    IERC20 public rewardsToken;
    // Staking token would be Sumero LP tokens
    IERC20 public stakingToken;

    // reward rate i.e. reward given per second
    uint256 public rewardRate = 100;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) public balances;

    constructor(address _stakedToken, address _rewardsToken) {
        stakingToken = IERC20(_stakedToken);
        rewardsToken = IERC20(_rewardsToken);
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return 0;
        }
        return
            rewardPerTokenStored +
            ((rewardRate * (block.timestamp - lastUpdateTime) * 1e18) /
                _totalSupply);
    }

    function earned(address _account) public view returns (uint256) {
        return
            ((balances[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        rewards[_account] = earned(_account);
        userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        _;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        _totalSupply += _amount;
        _balances[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, this(address), _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        _totalSupply -= _amount;
        _balances[msg.sender] -= _amount;
        stakingToken.transfer(msg.sender, _amount);
    }

    function getReward(uint256 _amount) external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        // how will staking contract transfer tokens
        rewardsToken.transfer(msg.sender, reward);
    }
}
