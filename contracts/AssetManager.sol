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

    enum Type {
        Emp,
        SwapPair,
        StakingReward
    }

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
        require(_asset != address(0), "AssetManager: ZERO_ADDRESS");
        totalEmpAssets = totalEmpAssets + 1;
        idToVerifiedEmps[totalEmpAssets] = Asset(_asset, Status.Open);
        emit Added(Type.Emp, _asset, totalEmpAssets);
    }

    function pauseEmp(uint256 id) external onlyOwner {
        require(
            idToVerifiedEmps[id].status == Status.Open,
            "AssetManager: ASSET_NOT_OPEN"
        );
        idToVerifiedEmps[id].status = Status.Paused;
        emit Paused(Type.Emp, idToVerifiedEmps[id].addr, id);
    }

    function unpauseEmp(uint256 id) external onlyOwner {
        require(
            idToVerifiedEmps[id].status == Status.Paused,
            "AssetManager: ASSET_NOT_PAUSED"
        );
        idToVerifiedEmps[id].status = Status.Open;
        emit Unpaused(Type.Emp, idToVerifiedEmps[id].addr, id);
    }

    function closeEmp(uint256 id) external onlyOwner {
        require(
            idToVerifiedEmps[id].addr != address(0),
            "AssetManager: ZERO_ADDRESS"
        );
        require(
            idToVerifiedEmps[id].status != Status.Closed,
            "AssetManager: ASSET_ALREADY_CLOSED"
        );
        idToVerifiedEmps[id].status = Status.Closed;
        emit Closed(Type.Emp, idToVerifiedEmps[id].addr, id);
    }

    // Swap Pairs
    function addSwapPair(address _asset) external onlyOwner {
        require(_asset != address(0), "AssetManager: ZERO_ADDRESS");
        totalSwapPairAssets = totalSwapPairAssets + 1;
        idToVerifiedSwapPairs[totalSwapPairAssets] = Asset(_asset, Status.Open);
        emit Added(Type.SwapPair, _asset, totalSwapPairAssets);
    }

    function pauseSwapPair(uint256 id) external onlyOwner {
        require(
            idToVerifiedSwapPairs[id].status == Status.Open,
            "AssetManager: ASSET_NOT_OPEN"
        );
        idToVerifiedSwapPairs[id].status = Status.Paused;
        emit Paused(Type.SwapPair, idToVerifiedSwapPairs[id].addr, id);
    }

    function unpauseSwapPair(uint256 id) external onlyOwner {
        require(
            idToVerifiedSwapPairs[id].status == Status.Paused,
            "AssetManager: ASSET_NOT_PAUSED"
        );
        idToVerifiedSwapPairs[id].status = Status.Open;
        emit Unpaused(Type.SwapPair, idToVerifiedSwapPairs[id].addr, id);
    }

    function closeSwapPair(uint256 id) external onlyOwner {
        require(
            idToVerifiedSwapPairs[id].addr != address(0),
            "AssetManager: ZERO_ADDRESS"
        );
        require(
            idToVerifiedSwapPairs[id].status != Status.Closed,
            "AssetManager: ASSET_ALREADY_CLOSED"
        );
        idToVerifiedSwapPairs[id].status = Status.Closed;
        emit Closed(Type.SwapPair, idToVerifiedSwapPairs[id].addr, id);
    }

    // Staking Rewards
    function addStakingReward(address _asset) external onlyOwner {
        require(_asset != address(0), "AssetManager: ZERO_ADDRESS");
        totalStakingRewardAssets = totalStakingRewardAssets + 1;
        idToVerifiedStakingRewards[totalStakingRewardAssets] = Asset(
            _asset,
            Status.Open
        );
        emit Added(Type.StakingReward, _asset, totalStakingRewardAssets);
    }

    function pauseStakingReward(uint256 id) external onlyOwner {
        require(
            idToVerifiedStakingRewards[id].status == Status.Open,
            "AssetManager: ASSET_NOT_OPEN"
        );
        idToVerifiedStakingRewards[id].status = Status.Paused;
        emit Paused(
            Type.StakingReward,
            idToVerifiedStakingRewards[id].addr,
            id
        );
    }

    function unpauseStakingReward(uint256 id) external onlyOwner {
        require(
            idToVerifiedStakingRewards[id].status == Status.Paused,
            "AssetManager: ASSET_NOT_PAUSED"
        );
        idToVerifiedStakingRewards[id].status = Status.Open;
        emit Unpaused(
            Type.StakingReward,
            idToVerifiedStakingRewards[id].addr,
            id
        );
    }

    function closeStakingReward(uint256 id) external onlyOwner {
        require(
            idToVerifiedStakingRewards[id].addr != address(0),
            "AssetManager: ZERO_ADDRESS"
        );
        require(
            idToVerifiedStakingRewards[id].status != Status.Closed,
            "AssetManager: ASSET_ALREADY_CLOSED"
        );
        idToVerifiedStakingRewards[id].status = Status.Closed;
        emit Closed(
            Type.StakingReward,
            idToVerifiedStakingRewards[id].addr,
            id
        );
    }

    /* ========== EVENTS ========== */

    event Added(
        Type indexed assetType,
        address indexed assetAddress,
        uint256 assetId
    );
    event Paused(
        Type indexed assetType,
        address indexed assetAddress,
        uint256 assetId
    );
    event Unpaused(
        Type indexed assetType,
        address indexed assetAddress,
        uint256 assetId
    );
    event Closed(
        Type indexed assetType,
        address indexed assetAddress,
        uint256 assetId
    );
}
