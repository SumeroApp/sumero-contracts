// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IClayToken.sol";

contract StakingRewards is Ownable, ReentrancyGuard, Pausable {
    IClayToken public clayToken;
    // Staking token would be Sumero LP tokens
    IERC20 public stakingToken;

    // TODO:
    // 3. Deterministic way to figure out how much CLAY would be rewarded on a daily basis
    // User would stake
    // User would unstake
    // User would request for reward withdrawal

    // Reward Rate per day
    // 10 reward tokens per second
    // 10 * (24 * 60 * 60)
    // 10 * 86400
    // 864,000 CLAY per day

    // reward rate i.e. reward given per second
    uint256 public rewardRate = 10;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) public balances;

    constructor(address _stakedToken, address _clayToken) {
        stakingToken = IERC20(_stakedToken);
        clayToken = IClayToken(_clayToken);
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

    function stake(uint256 _amount)
        external
        nonReentrant
        whenNotPaused
        updateReward(msg.sender)
    {
        _totalSupply += _amount;
        balances[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(uint256 _amount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        _totalSupply -= _amount;
        balances[msg.sender] -= _amount;
        stakingToken.transfer(msg.sender, _amount);
    }

    function getReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        // Sumero Owner needs to grant MINTER_ROLE for CLAY to StakingRewards
        clayToken.mint(msg.sender, reward);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
