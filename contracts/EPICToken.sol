// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract EPICToken is ERC20 {
    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol){
        _mint(msg.sender, 1000000 * (10 ** 18));
    }

    function faucet(address _recepient, uint256 _amt)public {
        require(_amt <= 20 ether, "less than 20 eth");
        _mint(_recepient, _amt);
    }
}
