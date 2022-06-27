// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClayToken is ERC20, Ownable {
    string internal constant NAME = "Clay Token";
    string internal constant SYMBOL = "CLAY";
    uint8 internal constant DECIMALS = 18;

    constructor() public ERC20("Clay Token", "CLAY") {}

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}
