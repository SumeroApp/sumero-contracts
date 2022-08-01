// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetManager is Ownable {
    uint256 public totalEmpAssets;
    mapping(uint256 => Asset) public idToVerifiedEmps;

    uint256 public totalSwapPairAssets;
    mapping(uint256 => Asset) public idToVerifiedSwapPairs;

    uint256 public totalStakingRewardAssets;
    mapping(uint256 => Asset) public idToVerifiedStakingRewards;

    enum Status {
        Closed,
        Paused,
        Open
    }

    struct Asset {
        address addr;
        Status status;
    }

    // EMPs
    function addEmp(address _asset) external onlyOwner {
        require(_asset != address(0), "Asset Manager: ZERO_ADDRESS");
        totalEmpAssets = totalEmpAssets + 1;
        idToVerifiedEmps[totalEmpAssets] = Asset(_asset, Status.Open);
    }

    function pauseEmp(uint256 id) external onlyOwner {
        require(
            idToVerifiedEmps[id].status == Status.Open,
            "Asset Manager: ASSET_NOT_OPEN"
        );
        idToVerifiedEmps[id].status = Status.Paused;
    }

    function unpauseEmp(uint256 id) external onlyOwner {
        require(
            idToVerifiedEmps[id].status == Status.Paused,
            "Asset Manager: ASSET_NOT_PAUSED"
        );
        idToVerifiedEmps[id].status = Status.Open;
    }

    function closeEmp(uint256 id) external onlyOwner {
        require(
            idToVerifiedEmps[id].addr != address(0),
            "Asset Manager: ZERO_ADDRESS"
        );
        require(
            idToVerifiedEmps[id].status != Status.Closed,
            "Asset Manager: ASSET_ALREADY_CLOSED"
        );
        idToVerifiedEmps[id].status = Status.Closed;
    }

    // Swap Pairs
    function addSwapPair(address _asset) external onlyOwner {
        require(_asset != address(0), "Asset Manager: ZERO_ADDRESS");
        totalSwapPairAssets = totalSwapPairAssets + 1;
        idToVerifiedSwapPairs[totalSwapPairAssets] = Asset(_asset, Status.Open);
    }

    function pauseSwapPair(uint256 id) external onlyOwner {
        require(
            idToVerifiedSwapPairs[id].status == Status.Open,
            "Asset Manager: ASSET_NOT_OPEN"
        );
        idToVerifiedSwapPairs[id].status = Status.Paused;
    }

    function unpauseSwapPair(uint256 id) external onlyOwner {
        require(
            idToVerifiedSwapPairs[id].status == Status.Paused,
            "Asset Manager: ASSET_NOT_PAUSED"
        );
        idToVerifiedSwapPairs[id].status = Status.Open;
    }

    function closeSwapPair(uint256 id) external onlyOwner {
        require(
            idToVerifiedSwapPairs[id].addr != address(0),
            "Asset Manager: ZERO_ADDRESS"
        );
        require(
            idToVerifiedSwapPairs[id].status != Status.Closed,
            "Asset Manager: ASSET_ALREADY_CLOSED"
        );
        idToVerifiedSwapPairs[id].status = Status.Closed;
    }

    // Staking Rewards
    function addStakingReward(address _asset) external onlyOwner {
        require(_asset != address(0), "Asset Manager: ZERO_ADDRESS");
        totalStakingRewardAssets = totalStakingRewardAssets + 1;
        idToVerifiedStakingRewards[totalStakingRewardAssets] = Asset(
            _asset,
            Status.Open
        );
    }

    function pauseStakingReward(uint256 id) external onlyOwner {
        require(
            idToVerifiedStakingRewards[id].status == Status.Open,
            "Asset Manager: ASSET_NOT_OPEN"
        );
        idToVerifiedStakingRewards[id].status = Status.Paused;
    }

    function unpauseStakingReward(uint256 id) external onlyOwner {
        require(
            idToVerifiedStakingRewards[id].status == Status.Paused,
            "Asset Manager: ASSET_NOT_PAUSED"
        );
        idToVerifiedStakingRewards[id].status = Status.Open;
    }

    function closeStakingReward(uint256 id) external onlyOwner {
        require(
            idToVerifiedStakingRewards[id].addr != address(0),
            "Asset Manager: ZERO_ADDRESS"
        );
        require(
            idToVerifiedStakingRewards[id].status != Status.Closed,
            "Asset Manager: ASSET_ALREADY_CLOSED"
        );
        idToVerifiedStakingRewards[id].status = Status.Closed;
    }
}
