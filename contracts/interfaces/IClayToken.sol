// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Interface of the Clay Token.
 */
interface IClayToken {
    function mint(address _to, uint256 _amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
}
