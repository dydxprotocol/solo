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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../protocol/interfaces/IAutoTrader.sol";
import "../../protocol/interfaces/IDolomiteMargin.sol";
import "../../protocol/lib/Math.sol";
import "../../protocol/lib/Require.sol";

import "../interfaces/IDolomiteAmmFactory.sol";
import "../interfaces/IDolomiteAmmPair.sol";

import "../lib/AdvancedMath.sol";
import "../lib/UQ112x112.sol";

import "../interfaces/ITransferProxy.sol";

import "./DolomiteAmmERC20.sol";


contract DolomiteAmmPair is IDolomiteAmmPair, DolomiteAmmERC20, IAutoTrader {
    using Math for uint;
    using SafeMath  for uint;
    using UQ112x112 for uint224;

    bytes32 internal constant FILE = "DolomiteAmmPair";

    uint public constant INDEX_BASE = 1e18;
    uint public constant MINIMUM_LIQUIDITY = 10 ** 3;

    address public factory;
    address public dolomiteMargin;
    address public dolomiteMarginTransferProxy;
    address public token0;
    address public token1;

    uint112 private reserve0Par;            // uses single storage slot, accessible via getReserves
    uint112 private reserve1Par;            // uses single storage slot, accessible via getReserves
    uint32  private blockTimestampLast;     // uses single storage slot, accessible via getReserves

    uint128 public marketId0;
    uint128 public marketId1;

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;
    uint public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event

    uint private unlocked = 1;
    modifier lock() {
        Require.that(
            unlocked == 1,
            FILE,
            "locked"
        );
        unlocked = 0;
        _;
        unlocked = 1;
    }

    struct DolomiteAmmCache {
        IDolomiteMargin dolomiteMargin;
        uint marketId0;
        uint marketId1;
        uint balance0Wei;
        uint balance1Wei;
        Interest.Index index0;
        Interest.Index index1;
    }

    constructor() public {
        factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(address _token0, address _token1, address _transferProxy) external {
        Require.that(
            msg.sender == factory,
            FILE,
            "forbidden"
        );
        Require.that(
            ITransferProxy(_transferProxy).isCallerTrusted(address(this)),
            FILE,
            "transfer proxy not enabled"
        );
        // sufficient check
        token0 = _token0;
        token1 = _token1;
        dolomiteMargin = IDolomiteAmmFactory(msg.sender).dolomiteMargin();
        dolomiteMarginTransferProxy = _transferProxy;

        marketId0 = uint128(IDolomiteMargin(dolomiteMargin).getMarketIdByTokenAddress(token0));
        marketId1 = uint128(IDolomiteMargin(dolomiteMargin).getMarketIdByTokenAddress(token1));

        uint chainId;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name())),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external lock returns (uint liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReservesPar();
        // gas savings
        IDolomiteMargin _dolomiteMargin = IDolomiteMargin(dolomiteMargin);
        uint balance0 = _getTokenBalancePar(_dolomiteMargin, marketId0);
        uint balance1 = _getTokenBalancePar(_dolomiteMargin, marketId1);
        uint amount0 = balance0.sub(_reserve0);
        uint amount1 = balance1.sub(_reserve1);

        Require.that(
            amount0 > 0,
            FILE,
            "invalid mint amount 0"
        );
        Require.that(
            amount1 > 0,
            FILE,
            "invalid mint amount 1"
        );

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint _totalSupply = totalSupply;
        // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = AdvancedMath.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            // permanently lock the first MINIMUM_LIQUIDITY tokens
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(amount0.mul(_totalSupply) / _reserve0, amount1.mul(_totalSupply) / _reserve1);
        }

        Require.that(
            liquidity > 0,
            FILE,
            "insufficient liquidity minted"
        );

        _mint(to, liquidity);

        _update(
            balance0,
            balance1,
            _reserve0,
            _reserve1
        );
        if (feeOn) kLast = uint(reserve0Par).mul(reserve1Par);
        // reserve0 and reserve1 are up-to-date
        emit Mint(msg.sender, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to, uint toAccountNumber) external lock returns (uint amount0Wei, uint amount1Wei) {
        (uint112 _reserve0, uint112 _reserve1,) = getReservesPar();
        // gas savings
        IDolomiteMargin _dolomiteMargin = IDolomiteMargin(dolomiteMargin);
        uint[] memory markets = new uint[](2);
        markets[0] = marketId0;
        markets[1] = marketId1;

        // gas savings
        uint balance0 = _getTokenBalancePar(_dolomiteMargin, markets[0]);
        uint balance1 = _getTokenBalancePar(_dolomiteMargin, markets[1]);

        bool feeOn;
        /* solium-disable indentation */
        {
            // new scope to prevent stack-too-deep issues
            uint liquidity = balanceOf[address(this)];

            uint token0Index = _dolomiteMargin.getMarketCurrentIndex(markets[0]).supply;
            uint token1Index = _dolomiteMargin.getMarketCurrentIndex(markets[1]).supply;

            feeOn = _mintFee(_reserve0, _reserve1);
            uint _totalSupply = totalSupply;
            // gas savings, must be defined here since totalSupply can update in _mintFee
            amount0Wei = (liquidity.mul(balance0) / _totalSupply).getPartialRoundHalfUp(token0Index, INDEX_BASE);
            // using balances ensures pro-rata distribution
            amount1Wei = (liquidity.mul(balance1) / _totalSupply).getPartialRoundHalfUp(token1Index, INDEX_BASE);
            Require.that(
                amount0Wei > 0 && amount1Wei > 0,
                FILE,
                "insufficient liquidity burned"
            );

            _burn(address(this), liquidity);
        }
        /* solium-enable indentation */

        uint[] memory amounts = new uint[](2);
        amounts[0] = amount0Wei;
        amounts[1] = amount1Wei;

        ITransferProxy(dolomiteMarginTransferProxy).transferMultipleWithMarkets(
            0,
            to,
            toAccountNumber,
            markets,
            amounts
        );

        balance0 = _getTokenBalancePar(_dolomiteMargin, markets[0]);
        balance1 = _getTokenBalancePar(_dolomiteMargin, markets[1]);

        _update(
            balance0,
            balance1,
            _reserve0,
            _reserve1
        );
        if (feeOn) kLast = uint(reserve0Par).mul(reserve1Par);

        // reserve0 and reserve1 are up-to-date
        emit Burn(
            msg.sender,
            amount0Wei,
            amount1Wei, to
        );
    }

    // force balances to match reserves
    function skim(address to, uint toAccountNumber) external lock {
        // gas savings
        IDolomiteMargin _dolomiteMargin = IDolomiteMargin(dolomiteMargin);

        uint[] memory markets = new uint[](2);
        markets[0] = marketId0;
        markets[1] = marketId1;

        uint amount0 = _getTokenBalancePar(_dolomiteMargin, markets[0]).sub(reserve0Par);
        uint amount1 = _getTokenBalancePar(_dolomiteMargin, markets[1]).sub(reserve1Par);

        uint[] memory amounts = new uint[](2);
        amounts[0] = amount0;
        amounts[1] = amount1;

        ITransferProxy(dolomiteMarginTransferProxy).transferMultipleWithMarkets(
            0,
            to,
            toAccountNumber,
            markets,
            amounts
        );
    }

    // force reserves to match balances
    function sync() external lock {
        IDolomiteMargin _dolomiteMargin = IDolomiteMargin(dolomiteMargin);
        _update(
            _getTokenBalancePar(_dolomiteMargin, marketId0),
            _getTokenBalancePar(_dolomiteMargin, marketId1),
            reserve0Par,
            reserve1Par
        );
    }

    function token0Symbol() public view returns (string memory) {
        address _token0 = token0;
        return _callOptionalReturn(_token0, abi.encodePacked(IERC20Detailed(_token0).symbol.selector));
    }

    function token1Symbol() public view returns (string memory) {
        address _token1 = token1;
        return _callOptionalReturn(_token1, abi.encodePacked(IERC20Detailed(_token1).symbol.selector));
    }

    function name() public view returns (string memory) {
        /* solium-disable-next-line arg-overflow */
        return string(abi.encodePacked("Dolomite LP Token: ", token0Symbol(), "_", token1Symbol()));
    }

    function symbol() public view returns (string memory) {
        /* solium-disable-next-line arg-overflow */
        return string(abi.encodePacked("DLP_", token0Symbol(), "_", token1Symbol()));
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }

    function getReservesPar() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0Par;
        _reserve1 = reserve1Par;
        _blockTimestampLast = blockTimestampLast;
    }

    function getReservesWei() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        IDolomiteMargin _dolomiteMargin = IDolomiteMargin(dolomiteMargin);

        uint reserve0InterestIndex = _dolomiteMargin.getMarketCurrentIndex(marketId0).supply;
        uint reserve1InterestIndex = _dolomiteMargin.getMarketCurrentIndex(marketId1).supply;

        _reserve0 = uint112(uint(reserve0Par).getPartialRoundHalfUp(reserve0InterestIndex, INDEX_BASE));
        _reserve1 = uint112(uint(reserve1Par).getPartialRoundHalfUp(reserve1InterestIndex, INDEX_BASE));
        _blockTimestampLast = blockTimestampLast;
    }

    function getTradeCost(
        uint256 inputMarketId,
        uint256 outputMarketId,
        Account.Info memory makerAccount,
        Account.Info memory takerAccount,
        Types.Par memory,
        Types.Par memory,
        Types.Wei memory inputWei,
        bytes memory data
    )
    public
    returns (Types.AssetAmount memory) {
        DolomiteAmmCache memory cache;
        /* solium-disable indentation */
        {
            IDolomiteMargin _dolomiteMargin = IDolomiteMargin(dolomiteMargin);
            cache = DolomiteAmmCache({
                dolomiteMargin : _dolomiteMargin,
                marketId0 : marketId0,
                marketId1 : marketId1,
                balance0Wei : _getTokenBalanceWei(_dolomiteMargin, marketId0),
                balance1Wei : _getTokenBalanceWei(_dolomiteMargin, marketId1),
                index0 : _dolomiteMargin.getMarketCurrentIndex(marketId0),
                index1 : _dolomiteMargin.getMarketCurrentIndex(marketId1)
            });
        }
        /* solium-enable indentation */

        Require.that(
            msg.sender == address(cache.dolomiteMargin),
            FILE,
            "invalid sender"
        );
        Require.that(
            makerAccount.owner == address(this),
            FILE,
            "invalid maker account owner"
        );
        Require.that(
            makerAccount.number == 0,
            FILE,
            "invalid maker account number"
        );
        Require.that(
            token0 != takerAccount.owner && token1 != takerAccount.owner && address(this) != takerAccount.owner,
            FILE,
            "invalid taker account owner"
        );

        uint amount0OutWei;
        uint amount1OutWei;
        /* solium-disable indentation */
        {
            Require.that(
                inputMarketId == cache.marketId0 || inputMarketId == cache.marketId1,
                FILE,
                "invalid input market"
            );
            Require.that(
                outputMarketId == cache.marketId0 || outputMarketId == cache.marketId1,
                FILE,
                "invalid output market"
            );
            Require.that(
                inputWei.sign,
                FILE,
                "input wei must be positive"
            );

            (uint amountOutWei) = abi.decode(data, ((uint)));

            Require.that(
                amountOutWei > 0,
                FILE,
                "insufficient output amount"
            );

            if (inputMarketId == cache.marketId0) {
                cache.balance0Wei = cache.balance0Wei.add(inputWei.value);
                cache.balance1Wei = cache.balance1Wei.sub(amountOutWei);

                amount0OutWei = 0;
                amount1OutWei = amountOutWei;
            } else {
                assert(inputMarketId == cache.marketId1);

                cache.balance1Wei = cache.balance1Wei.add(inputWei.value);
                cache.balance0Wei = cache.balance0Wei.sub(amountOutWei);

                amount0OutWei = amountOutWei;
                amount1OutWei = 0;
            }
        }
        /* solium-enable indentation */

        uint amount0InWei;
        uint amount1InWei;
        /* solium-disable indentation */
        {
            // gas savings
            (uint112 _reserve0, uint112 _reserve1,) = getReservesWei();
            Require.that(
                amount0OutWei < _reserve0 && amount1OutWei < _reserve1,
                FILE,
                "insufficient liquidity"
            );

            amount0InWei = cache.balance0Wei > (_reserve0 - amount0OutWei)
            ? cache.balance0Wei - (_reserve0 - amount0OutWei) : 0;

            amount1InWei = cache.balance1Wei > (_reserve1 - amount1OutWei)
            ? cache.balance1Wei - (_reserve1 - amount1OutWei) : 0;

            Require.that(
                amount0InWei > 0 || amount1InWei > 0,
                FILE,
                "insufficient input amount"
            );

            uint balance0Adjusted = cache.balance0Wei.mul(1000).sub(amount0InWei.mul(3));
            uint balance1Adjusted = cache.balance1Wei.mul(1000).sub(amount1InWei.mul(3));
            Require.that(
                balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000 ** 2),
                FILE,
                "K"
            );

            // convert the numbers from wei to par
            _update(
                cache.balance0Wei.getPartialRoundHalfUp(INDEX_BASE, cache.index0.supply),
                cache.balance1Wei.getPartialRoundHalfUp(INDEX_BASE, cache.index1.supply),
                uint112(uint(_reserve0).getPartialRoundHalfUp(INDEX_BASE, cache.index0.supply)),
                uint112(uint(_reserve1).getPartialRoundHalfUp(INDEX_BASE, cache.index1.supply))
            );
        }
        /* solium-enable indentation */

        emit Swap(
            msg.sender,
            amount0InWei,
            amount1InWei,
            amount0OutWei,
            amount1OutWei,
            takerAccount.owner
        );

        return Types.AssetAmount({
        sign : false,
        denomination : Types.AssetDenomination.Wei,
        ref : Types.AssetReference.Delta,
        value : amount0OutWei > 0 ? amount0OutWei : amount1OutWei
        });
    }

    // ============ Internal Functions ============

    function _callOptionalReturn(address token, bytes memory data) internal view returns (string memory) {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves.

        // A Solidity high level call has three parts:
        // 1. The target address is checked to contain contract code. Not needed since tokens are manually added
        // 2. The call itself is made, and success asserted
        // 3. The return value is decoded, which in turn checks the size of the returned data.

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = token.staticcall(data);

        if (success && returnData.length > 0) {
            // Return data is optional
            return abi.decode(returnData, (string));
        } else {
            return "";
        }
    }

    function _encodeTransferAction(
        uint fromAccountIndex,
        uint toAccountIndex,
        uint marketId,
        uint amount
    ) internal pure returns (Actions.ActionArgs memory) {
        return Actions.ActionArgs({
        actionType : Actions.ActionType.Transfer,
        accountId : fromAccountIndex,
        /* solium-disable-next-line arg-overflow */
        amount : Types.AssetAmount(false, Types.AssetDenomination.Par, Types.AssetReference.Delta, amount),
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : toAccountIndex,
        data : bytes("")
        });
    }

    /// @dev Updates reserves and, on the first call per block, price accumulators. THESE SHOULD ALL BE IN PAR
    function _update(
        uint balance0,
        uint balance1,
        uint112 reserve0,
        uint112 reserve1
    ) internal {
        Require.that(
            balance0 <= uint112(- 1) && balance1 <= uint112(- 1),
            FILE,
            "balance overflow"
        );

        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        // overflow is desired
        if (timeElapsed > 0 && reserve0 != 0 && reserve1 != 0) {
            // * never overflows, and + overflow is desired
            price0CumulativeLast += uint(UQ112x112.encode(reserve1).uqdiv(reserve0)) * timeElapsed;
            price1CumulativeLast += uint(UQ112x112.encode(reserve0).uqdiv(reserve1)) * timeElapsed;
        }
        reserve0Par = uint112(balance0);
        reserve1Par = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0Par, reserve1Par);
    }

    // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(
        uint112 reserve0,
        uint112 reserve1
    ) internal returns (bool feeOn) {
        address feeTo = IDolomiteAmmFactory(factory).feeTo();
        // gas savings
        feeOn = feeTo != address(0);
        uint _kLast = kLast;
        // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint rootK = AdvancedMath.sqrt(uint(reserve0).mul(reserve1));
                uint rootKLast = AdvancedMath.sqrt(_kLast);
                if (rootK > rootKLast) {
                    // Fee is 1/3 of the trading fee of 0.3%, which is 0.1% or 0.001
                    uint numerator = totalSupply.mul(rootK.sub(rootKLast));
                    uint denominator = rootK.mul(2).add(rootKLast);
                    uint liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    function _getTokenBalancePar(
        IDolomiteMargin _dolomiteMargin,
        uint marketId
    ) internal view returns (uint) {
        return _dolomiteMargin.getAccountPar(Account.Info(address(this), 0), marketId).value;
    }

    function _getTokenBalanceWei(
        IDolomiteMargin _dolomiteMargin,
        uint marketId
    ) internal view returns (uint) {
        return _dolomiteMargin.getAccountWei(Account.Info(address(this), 0), marketId).value;
    }

}
