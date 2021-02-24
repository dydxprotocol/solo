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

import {SafeMath} from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import {Ownable} from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import {Account} from "../../protocol/lib/Account.sol";
import {Actions} from "../../protocol/lib/Actions.sol";
import {Types} from "../../protocol/lib/Types.sol";
import {OnlySolo} from "../helpers/OnlySolo.sol";
import {TypedSignature} from "../lib/TypedSignature.sol";
import {UniswapV2Library} from  "../lib/UniswapV2Library.sol";

import {IUniswapV2Factory} from "../interfaces/IUniswapV2Factory.sol";
import {IUniswapV2Pair} from "../interfaces/IUniswapV2Pair.sol";

contract DolomiteAmmRouterProxy is OnlySolo, ReentrancyGuard {

    using UniswapV2Library for *;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'DolomiteAmmRouterProxy: EXPIRED');
        _;
    }

    IUniswapV2Factory public UNISWAP_FACTORY;
    address public WETH;

    constructor(
        address soloMargin,
        address uniswapFactory,
        address weth
    ) public OnlySolo(soloMargin) {
        UNISWAP_FACTORY = IUniswapV2Factory(uniswapFactory);
        WETH = weth;
    }

    function addLiquidity(
        address to,
        uint fromAccountNumber,
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        uint deadline
    )
    external
    ensure(deadline)
    returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = UniswapV2Library.pairFor(address(UNISWAP_FACTORY), tokenA, tokenB);

        {
            Account.Info[] memory accounts = new Account.Info[](2);
            accounts[0] = Account.Info(msg.sender, fromAccountNumber);
            accounts[1] = Account.Info(pair, 0);

            uint marketIdA = SOLO_MARGIN.getMarketIdByTokenAddress(tokenA);
            uint marketIdB = SOLO_MARGIN.getMarketIdByTokenAddress(tokenB);

            Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2);
            actions[0] = _encodeTransferAction(0, 1, marketIdA, amountA);
            actions[1] = _encodeTransferAction(0, 1, marketIdB, amountB);
            SOLO_MARGIN.operate(accounts, actions);
        }

        liquidity = IUniswapV2Pair(pair).mint(to);
    }

    function removeLiquidity(
        address to,
        uint fromAccountNumber,
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        uint deadline
    ) public ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = UniswapV2Library.pairFor(address(UNISWAP_FACTORY), tokenA, tokenB);
        // send liquidity to pair
        IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity);

        (uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to, fromAccountNumber);
        (address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'DolomiteAmmRouterProxy::removeLiquidity: INSUFFICIENT_B_AMOUNT');
    }

    function swapExactTokensForTokens(
        uint accountNumber,
        uint amountInWei,
        uint amountOutMinWei,
        address[] calldata tokenPath,
        uint deadline
    )
    external
    ensure(deadline) {
        uint[] memory marketPath = new uint[](tokenPath.length);
        for (uint i = 0; i < tokenPath.length; i++) {
            marketPath[i] = SOLO_MARGIN.getMarketIdByTokenAddress(tokenPath[i]);
        }

        // pools.length == tokenPath.length - 1
        address[] memory pools = UniswapV2Library.getPools(address(UNISWAP_FACTORY), tokenPath);

        Account.Info[] memory accounts = new Account.Info[](1 + (tokenPath.length - 1));
        accounts[0] = Account.Info(msg.sender, accountNumber);
        for (uint i = 0; i < pools.length; i++) {
            accounts[i + 1] = Account.Info(pools[i], 0);
        }

        uint[] memory amountsOutWei = UniswapV2Library.getAmountsOutWei(address(UNISWAP_FACTORY), amountInWei, tokenPath);
        require(
            amountsOutWei[amountsOutWei.length - 1] >= amountOutMinWei,
            "DolomiteAmmRouterProxy::swapExactTokensForTokens: INSUFFICIENT_AMOUNT_OUT"
        );

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](pools.length);

        for (uint i = 0; i < pools.length; i++) {
            // Putting this variable here prevents the stack too deep issue
            actions[i] = _encodeTradeAction(
                0,
                i + 1,
                marketPath[i],
                marketPath[i + 1],
                pools[i],
                amountsOutWei[i],
                amountsOutWei[i + 1]
            );
        }
        SOLO_MARGIN.operate(accounts, actions);
    }

    // *************************
    // ***** Internal Functions
    // *************************

    function _encodeTransferAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint marketId,
        uint amount
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Transfer,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amount),
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : toAccountIndex,
        data : bytes("")
        });
    }

    function _encodeTradeAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint primaryMarketId,
        uint secondaryMarketId,
        address traderAddress,
        uint amountInWei,
        uint amountOutWei
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Trade,
        accountId : fromAccountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
        primaryMarketId : primaryMarketId,
        secondaryMarketId : secondaryMarketId,
        otherAddress : traderAddress,
        otherAccountId : toAccountIndex,
        data : abi.encode(amountOutWei)
        });
    }

    function _encodeCallAction(
        uint accountIndex,
        address callee,
        bytes memory data
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Call,
        accountId : accountIndex,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, 0),
        primaryMarketId : uint(- 1),
        secondaryMarketId : uint(- 1),
        otherAddress : callee,
        otherAccountId : uint(- 1),
        data : data
        });
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        if (UNISWAP_FACTORY.getPair(tokenA, tokenB) == address(0)) {
            UNISWAP_FACTORY.createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB) = UniswapV2Library.getReservesWei(address(UNISWAP_FACTORY), tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'DolomiteAmmRouterProxy::_addLiquidity: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'DolomiteAmmRouterProxy::_addLiquidity: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

}
