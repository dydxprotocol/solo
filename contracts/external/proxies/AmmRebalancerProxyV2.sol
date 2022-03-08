/*

    Copyright 2022 Dolomite.

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

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@uniswap/lib/contracts/libraries/Babylonian.sol";

import "../../protocol/interfaces/IExchangeWrapper.sol";
import "../../protocol/interfaces/IDolomiteMargin.sol";

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";
import "../../protocol/lib/Require.sol";
import "../../protocol/lib/Types.sol";

import "../lib/DolomiteAmmLibrary.sol";

import "../helpers/OnlyDolomiteMargin.sol";


/**
 * @title AmmRebalancerProxyV2
 * @author Dolomite
 *
 * Contract for re-balancing the Dolomite AMM pools against other UniswapV3Router compatible pools
 */
contract AmmRebalancerProxyV2 is IExchangeWrapper, OnlyDolomiteMargin {
    using SafeERC20 for IERC20;
    using SafeMath for uint;

    bytes32 public constant FILE = "AmmRebalancerProxyV2";

    address public DOLOMITE_AMM_FACTORY;
    address public UNISWAP_V3_MULTI_ROUTER;

    struct RebalanceCache {
        address dolomiteFactory;
        address dolomitePool;
    }

    // ============ Constructor ============

    constructor (
        address dolomiteMargin,
        address dolomiteAmmFactory,
        address uniswapV3MultiRouter
    )
    public
    OnlyDolomiteMargin(dolomiteMargin)
    {
        DOLOMITE_AMM_FACTORY = dolomiteAmmFactory;
        UNISWAP_V3_MULTI_ROUTER = uniswapV3MultiRouter;
    }

    function performRebalance(
        bytes calldata _dolomitePath,
        uint _truePriceTokenA,
        uint _truePriceTokenB,
        uint _otherAmountIn,
        bytes calldata _uniswapV3CallData
    ) external {
        Require.that(
            _dolomitePath.length == 40,
            FILE,
            "invalid path length"
        );

        address[] memory dolomitePath = _decodeRawPath(_dolomitePath);

        // solium-disable indentation
        RebalanceCache memory cache;
        {
            address dolomiteFactory = DOLOMITE_AMM_FACTORY;
            cache = RebalanceCache({
                dolomiteFactory: dolomiteFactory,
                dolomitePool: DolomiteAmmLibrary.getPools(dolomiteFactory, dolomitePath)[0]
            });
        }
        // solium-enable indentation

        uint dolomiteAmountIn;
        // solium-disable indentation
        {
            (uint256 reserveA, uint256 reserveB) = DolomiteAmmLibrary.getReservesWei(
                cache.dolomiteFactory,
                dolomitePath[0],
                dolomitePath[1]
            );
            (bool isAToB, uint _dolomiteAmountIn) = _computeProfitMaximizingTrade(
                _truePriceTokenA,
                _truePriceTokenB,
                reserveA,
                reserveB
            );

            Require.that(
                isAToB,
                FILE,
                "invalid aToB"
            );

            dolomiteAmountIn = _dolomiteAmountIn;
        }
        // solium-enable indentation

        // 2 for msg.sender and 1 for the Dolomite AMM Pool to be traded against
        Account.Info[] memory accounts = new Account.Info[](3);
        accounts[0] = Account.Info({
            owner : msg.sender,
            number : 0
        });
        accounts[1] = Account.Info({
            owner : msg.sender,
            number : uint(-1)
        });
        accounts[2] = Account.Info({
            owner : cache.dolomitePool,
            number : 0
        });

        uint[] memory dolomiteMarketPath = _getMarketPathFromTokenPath(dolomitePath);

        // 1 action for transferring, 1 for selling via the other router, and trades are paths.length - 1
        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2 + dolomitePath.length - 1);

        // trade from accountIndex=1 and transfer to 0, to ensure re-balances are down with flash-loaned funds
        // the dolomiteInputMarketId is the output market for the other trade and vice versa
        /* solium-disable indentation */
        actions[0] = _encodeSell(
            1,
            dolomiteMarketPath[dolomiteMarketPath.length - 1],
            dolomiteMarketPath[0],
            _otherAmountIn,
            /* amountOutMinWei= */ dolomiteAmountIn, // minimum amount we'll accept should cover the arb
            _uniswapV3CallData
        );
        /* solium-enable indentation */

        uint[] memory dolomiteAmountsOut = DolomiteAmmLibrary.getAmountsOutWei(
            cache.dolomiteFactory,
            dolomiteAmountIn,
            dolomitePath
        );
        Require.that(
            dolomiteAmountsOut.length == 2,
            FILE,
            "invalid amounts out length"
        );
        Require.that(
            _otherAmountIn <= dolomiteAmountsOut[dolomiteAmountsOut.length - 1],
            FILE,
            "arb closed"
        );

        Require.that(
            accounts[2].owner == cache.dolomitePool,
            FILE,
            "invalid pool owner address"
        );
        actions[1] = _encodeTrade(
            1,
            2,
            dolomiteMarketPath[0],
            dolomiteMarketPath[1],
            cache.dolomitePool,
            dolomiteAmountsOut[0],
            dolomiteAmountsOut[1]
        );

        actions[actions.length - 1] = _encodeTransferAll(
            1,
            0,
            dolomiteMarketPath[dolomiteMarketPath.length - 1]
        );

        DOLOMITE_MARGIN.operate(accounts, actions);
    }

    function exchange(
        address,
        address receiver,
        address makerToken,
        address takerToken,
        uint256 requestedFillAmount,
        bytes calldata data
    )
    external
    onlyDolomiteMargin(msg.sender)
    returns (uint256) {
        address router = UNISWAP_V3_MULTI_ROUTER;

        _checkAllowanceAndApprove(takerToken, router, requestedFillAmount);

        (uint minAmountOutWei, bytes memory uniswapV3CallData) = abi.decode(data, (uint, bytes));

        // solium-disable-next-line security/no-low-level-calls
        (bool success,) = router.call(uniswapV3CallData);
        Require.that(success, FILE, "UniswapV3 call failed");

        uint amount = IERC20(makerToken).balanceOf(address(this));

        Require.that(
            amount >= minAmountOutWei,
            FILE,
            "arb not profitable"
        );

        _checkAllowanceAndApprove(makerToken, receiver, amount);

        return amount;
    }

    function getExchangeCost(
        address,
        address,
        uint256,
        bytes calldata
    )
    external
    view
    returns (uint256) {
        Require.that(false, FILE, "not callable");
        return 0;
    }

    // ============ Internal Functions ============

    function _computeProfitMaximizingTrade(
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 reserveA,
        uint256 reserveB
    )
        internal
        pure
        returns (bool isAToB, uint256 amountIn)
    {
        isAToB = reserveA.mul(truePriceTokenB).div(reserveB) < truePriceTokenA;

        uint256 invariant = reserveA.mul(reserveB);

        uint256 leftSide = Babylonian.sqrt(
            invariant.mul(isAToB ? truePriceTokenA : truePriceTokenB).mul(1000) /
            uint256(isAToB ? truePriceTokenB : truePriceTokenA).mul(997)
        );
        uint256 rightSide = (isAToB ? reserveA.mul(1000) : reserveB.mul(1000)) / 997;

        if (leftSide < rightSide) {
            return (false, 0);
        }

        // compute the amount that must be sent to move the price to the profit-maximizing price
        amountIn = leftSide.sub(rightSide);
    }

    function _decodeRawPath(
        bytes memory rawPath
    ) internal pure returns (address[] memory) {
        Require.that(
            rawPath.length % 20 == 0 && rawPath.length >= 40,
            FILE,
            "invalid path length"
        );
        address[] memory path = new address[](rawPath.length / 20);
        for (uint i = 0; i < path.length; i++) {
            uint offset = 20 * i; // 20 bytes per address
            bytes20 token;
            // solium-disable-next-line
            assembly {
                token := mload(add(add(rawPath, 32), offset))
            }
            path[i] = address(token);
        }
        return path;
    }

    function _checkAllowanceAndApprove(
        address token,
        address spender,
        uint amount
    ) internal {
        if (IERC20(token).allowance(address(this), spender) < amount) {
            IERC20(token).safeApprove(spender, uint(- 1));
        }
    }

    function _encodeSell(
        uint fromAccountIndex,
        uint primaryMarketId,
        uint secondaryMarketId,
        uint amountInWei,
        uint amountOutMinWei,
        bytes memory uniswapV3Data
    ) internal view returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
            actionType : Actions.ActionType.Sell,
            accountId : fromAccountIndex,
            // solium-disable-next-line arg-overflow
            amount : Types.AssetAmount(false, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
            primaryMarketId : primaryMarketId,
            secondaryMarketId : secondaryMarketId,
            otherAddress : address(this),
            otherAccountId : 0,
            data : abi.encode(amountOutMinWei, uniswapV3Data)
        });
    }

    function _encodeTrade(
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
            // solium-disable-next-line arg-overflow
            amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Delta, amountInWei),
            primaryMarketId : primaryMarketId,
            secondaryMarketId : secondaryMarketId,
            otherAddress : traderAddress,
            otherAccountId : toAccountIndex,
            data : abi.encode(amountOutWei)
        });
    }

    function _encodeTransferAll(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint marketId
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
            actionType : Actions.ActionType.Transfer,
            accountId : fromAccountIndex,
            // solium-disable-next-line arg-overflow
            amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0),
            primaryMarketId : marketId,
            secondaryMarketId : uint(- 1),
            otherAddress : address(0),
            otherAccountId : toAccountIndex,
            data : bytes("")
        });
    }

    function _getMarketPathFromTokenPath(
        address[] memory path
    ) internal view returns (uint[] memory) {
        IDolomiteMargin dolomiteMargin = DOLOMITE_MARGIN;
        uint[] memory marketPath = new uint[](path.length);
        for (uint i = 0; i < path.length; i++) {
            marketPath[i] = dolomiteMargin.getMarketIdByTokenAddress(path[i]);
        }
        return marketPath;
    }

}
