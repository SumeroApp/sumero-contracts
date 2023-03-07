// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ClayDistributor {
    using SafeERC20 for IERC20;

    address public immutable token;
    bytes32 public immutable merkleRoot;
    uint256 public immutable dropAmount;

    mapping(address => bool) private isClaimed;

    constructor(
        address token_,
        bytes32 merkleRoot_,
        uint256 dropAmount_
    ) {
        token = token_;
        merkleRoot = merkleRoot_;
        dropAmount = dropAmount_;
    }

    event Claimed(address indexed user);

    function claim(bytes32[] calldata merkleProof) public {
        require(isClaimed[msg.sender] == false, "Already Claimed!");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(msg.sender));

        require(
            MerkleProof.verify(merkleProof, merkleRoot, node),
            "Invalid Proof!"
        );

        // Mark it claimed and send the token.
        isClaimed[msg.sender] = true;
        IERC20(token).safeTransfer(msg.sender, dropAmount);

        emit Claimed(msg.sender);
    }
}
