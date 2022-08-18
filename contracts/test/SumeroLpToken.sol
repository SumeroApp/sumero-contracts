// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract SumeroLpToken is ERC20, Ownable{
    string internal constant NAME = "Sumero LP Token";
    string internal constant SYMBOL = "SLPT";
    uint8 internal constant DECIMALS = 18;

    constructor() ERC20("Sumero LP Token", "SLPT") {
    }

    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
}
