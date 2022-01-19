/*

    Copyright 2019 dYdX Trading Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IERC20Detailed } from "../protocol/interfaces/IERC20Detailed.sol";


contract TestToken is IERC20Detailed {
    using SafeMath for uint256;

    uint256 supply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    event Issue(address indexed token, address indexed owner, uint256 value);

    // Allow anyone to get new token
    function issue(uint256 amount) public {
        issueTo(msg.sender, amount);
    }

    function setBalance(address _target, uint _value) public {
        balances[_target] = _value;
        emit Transfer(address(0x0), _target, _value);
    }

    function addBalance(
        address _target,
        uint _value
    )
    public
    {
        uint currBalance = balanceOf(_target);
        require(_value + currBalance >= currBalance, "INVALID_VALUE");
        balances[_target] = currBalance.add(_value);
        emit Transfer(address(0x0), _target, _value);
    }

    function issueTo(address who, uint256 amount) public {
        supply = supply.add(amount);
        balances[who] = balances[who].add(amount);
        emit Issue(address(this), who, amount);
    }

    function totalSupply() public view returns (uint256) {
        return supply;
    }

    function balanceOf(address who) public view returns (uint256) {
        return balances[who];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return allowed[owner][spender];
    }

    function symbol() public view returns (string memory) {
        return "TEST";
    }

    function name() public view returns (string memory) {
        return "Test Token";
    }

    function decimals() public view returns (uint8) {
        return 18;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balances[msg.sender] >= value, "Token: Transfer failed");

        balances[msg.sender] = balances[msg.sender].sub(value);
        balances[to] = balances[to].add(value);
        emit Transfer(
            msg.sender,
            to,
            value
        );
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balances[from] >= value, "#transferFrom: INSUFFICIENT_BALANCE");
        require(allowed[from][msg.sender] >= value, "#transferFrom: INSUFFICIENT_ALLOWANCE");

        balances[to] = balances[to].add(value);
        balances[from] = balances[from].sub(value);
        allowed[from][msg.sender] = allowed[from][msg.sender].sub(value);
        emit Transfer(
            from,
            to,
            value
        );
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowed[msg.sender][spender] = value;
        emit Approval(
            msg.sender,
            spender,
            value
        );
        return true;
    }
}
