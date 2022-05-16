pragma solidity 0.6.12;
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetManager is Ownable {
    uint256 public totalAssets;
    enum AssetStatus {
        Closed,
        Paused,
        Open
    }
    mapping(address => AssetStatus) public assetStatus;
    mapping(uint256 => address) public idToVerifiedAsset;

    function add(address _asset) external onlyOwner {
        assetStatus[_asset] = AssetStatus.Open;
        totalAssets = totalAssets + 1;
        idToVerifiedAsset[totalAssets] = _asset;
    }

    function pause(address _asset) external onlyOwner {
        assetStatus[_asset] = AssetStatus.Paused;
    }

    function close(address _asset) external onlyOwner {
        assetStatus[_asset] = AssetStatus.Closed;
    }
}
