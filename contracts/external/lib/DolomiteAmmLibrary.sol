/*

    Copyright 2021 Dolomite.

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

pragma solidity >=0.5.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "../../protocol/lib/Require.sol";

import "../uniswap-v2/interfaces/IUniswapV2Pair.sol";

import "../interfaces/IDolomiteAmmFactory.sol";
import "../interfaces/IDolomiteAmmPair.sol";


library DolomiteAmmLibrary {
    using SafeMath for uint;

    bytes32 private constant FILE = "DolomiteAmmLibrary";
    bytes32 private constant PAIR_INIT_CODE_HASH = 0x71f2b6858dda1ac4596bffd34e6a767f1847201041dd0c76ed963877e5461b86;

    function getPairInitCodeHash(address factory) internal pure returns (bytes32) {
        // Instead of only returning PAIR_INIT_CODE_HASH, this value is used to make running test coverage possible;
        // test coverage changes the bytecode on the fly, which messes up the static value for init_code_hash
        return PAIR_INIT_CODE_HASH == bytes32(0)
            ? IDolomiteAmmFactory(factory).getPairInitCodeHash()
            : PAIR_INIT_CODE_HASH;
    }

    function getPools(
        address factory,
        address[] memory path
    ) internal pure returns (address[] memory) {
        return getPools(factory, getPairInitCodeHash(factory), path);
    }

    function getPools(
        address factory,
        bytes32 initCodeHash,
        address[] memory path
    ) internal pure returns (address[] memory) {
        Require.that(
            path.length >= 2,
            FILE,
            "invalid path length"
        );

        address[] memory pools = new address[](path.length - 1);
        for (uint i = 0; i < path.length - 1; i++) {
            pools[i] = pairFor(
                factory,
                path[i],
                path[i + 1],
                initCodeHash
            );
        }
        return pools;
    }

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        Require.that(
            tokenA != tokenB,
            FILE,
            "identical addresses"
        );
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Require.that(
            token0 != address(0),
            FILE,
            "zero address"
        );
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        return pairFor(
            factory,
            tokenA,
            tokenB,
            getPairInitCodeHash(factory)
        );
    }

    function pairFor(
        address factory,
        address tokenA,
        address tokenB,
        bytes32 initCodeHash
    ) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint(
                keccak256(
                    abi.encodePacked(
                        hex"ff",
                        factory,
                        keccak256(abi.encodePacked(token0, token1)),
                        initCodeHash
                    )
                )
            )
        );
    }

    // fetches and sorts the reserves for a pair
    function getReservesWei(
        address factory,
        address tokenA,
        address tokenB
    ) internal view returns (uint reserveA, uint reserveB) {
        return getReservesWei(
            factory,
            getPairInitCodeHash(factory),
            tokenA,
            tokenB
        );
    }

    function getReserves(
        address factory,
        bytes32 initCodeHash,
        address tokenA,
        address tokenB
    ) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(
            pairFor(
                factory,
                tokenA,
                tokenB,
                initCodeHash
            )
        ).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function getReservesWei(
        address factory,
        bytes32 initCodeHash,
        address tokenA,
        address tokenB
    ) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IDolomiteAmmPair(
            pairFor(
                factory,
                tokenA,
                tokenB,
                initCodeHash
            )
        ).getReservesWei();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        Require.that(
            amountA > 0,
            FILE,
            "insufficient amount"
        );
        Require.that(
            reserveA > 0 && reserveB > 0,
            FILE,
            "insufficient liquidity"
        );
        amountB = amountA.mul(reserveB) / reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        Require.that(
            amountIn > 0,
            FILE,
            "insufficient input amount"
        );
        Require.that(
            reserveIn > 0 && reserveOut > 0,
            FILE,
            "insufficient liquidity"
        );
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
        Require.that(
            amountOut > 0,
            FILE,
            "insufficient output amount"
        );
        Require.that(
            reserveIn > 0 && reserveOut > 0,
            FILE,
            "insufficient liquidity"
        );
        uint numerator = reserveIn.mul(amountOut).mul(1000);
        uint denominator = reserveOut.sub(amountOut).mul(997);
        // reverts from the 'sub'
        amountIn = numerator.div(denominator).add(1);
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOutWei(
        address factory,
        uint amountIn,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        Require.that(
            path.length >= 2,
            FILE,
            "invalid path"
        );
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReservesWei(factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOutWei(
        address factory,
        bytes32 initCodeHash,
        uint amountIn,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        Require.that(
            path.length >= 2,
            FILE,
            "invalid path"
        );
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReservesWei(
                factory,
                initCodeHash,
                path[i],
                path[i + 1]
            );
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsInWei(
        address factory,
        bytes32 initCodeHash,
        uint amountOut,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        Require.that(
            path.length >= 2,
            FILE,
            "invalid path"
        );
        amounts = new uint[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint i = path.length - 1; i > 0; i--) {
            (uint reserveIn, uint reserveOut) = getReservesWei(
                factory,
                initCodeHash,
                path[i - 1],
                path[i]
            );
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(
        address factory,
        bytes32 initCodeHash,
        uint amountOut,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        Require.that(
            path.length >= 2,
            FILE,
            "invalid path"
        );
        amounts = new uint[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint i = path.length - 1; i > 0; i--) {
            (uint reserveIn, uint reserveOut) = getReserves(
                factory,
                initCodeHash,
                path[i - 1],
                path[i]
            );
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsInWei(
        address factory,
        uint amountOut,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        return getAmountsInWei(
            factory,
            getPairInitCodeHash(factory),
            amountOut,
            path
        );
    }
}
