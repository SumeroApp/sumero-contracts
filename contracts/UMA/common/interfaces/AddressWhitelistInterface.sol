// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface AddressWhitelistInterface {
    function addToWhitelist(address newElement) external;

    function removeFromWhitelist(address newElement) external;

    function isOnWhitelist(address newElement) external view returns (bool);

    function getWhitelist() external view returns (address[] memory);
}
