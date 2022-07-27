// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetManager is Ownable {
    enum AssetStatus {
        Closed,
        Paused,
        Open
    }

    mapping(address => AssetStatus) public assetStatus;

    uint256 public totalEmps;
    mapping(uint256 => address) public idToVerifiedEmp;

    uint256 public totalStakingPools;
    mapping(uint256 => address) public idToVerifiedStakingPool;

    function addEmp(address _asset) external onlyOwner {
        assetStatus[_asset] = AssetStatus.Open;
        totalEmps = totalEmps + 1;
        idToVerifiedEmp[totalEmps] = _asset;
    }

    function addStakingPool(address _asset) external onlyOwner {
        assetStatus[_asset] = AssetStatus.Open;
        totalStakingPools = totalStakingPools + 1;
        idToVerifiedStakingPool[totalStakingPools] = _asset;
    }

    function pause(address _asset) external onlyOwner {
        assetStatus[_asset] = AssetStatus.Paused;
    }

    function close(address _asset) external onlyOwner {
        assetStatus[_asset] = AssetStatus.Closed;
    }
}
