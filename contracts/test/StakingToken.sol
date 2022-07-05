// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract StakingToken is ERC20, Ownable{
    string internal constant NAME = "Sumero Staking Token";
    string internal constant SYMBOL = "SST";
    uint8 internal constant DECIMALS = 18;

    constructor() ERC20("Sumero Staking Token", "SST") {
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}
