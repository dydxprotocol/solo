pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../protocol/interfaces/IAutoTrader.sol";
import "../../protocol/interfaces/ISoloMargin.sol";

import "../interfaces/IDolomiteAmmFactory.sol";
import "../interfaces/IDolomiteAmmPair.sol";

import "../lib/AdvancedMath.sol";
import "../lib/UQ112x112.sol";

import "../interfaces/ITransferProxy.sol";


import "./DolomiteAmmERC20.sol";

contract DolomiteAmmPair is IDolomiteAmmPair, DolomiteAmmERC20, IAutoTrader {
    using SafeMath  for uint;
    using UQ112x112 for uint224;

    uint public constant INTEREST_INDEX_BASE = 1e18;
    uint public constant MINIMUM_LIQUIDITY = 10 ** 3;

    address public factory;
    address public soloMargin;
    address public soloMarginTransferProxy;
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
        require(unlocked == 1, "DLP: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    struct Cache {
        ISoloMargin soloMargin;
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
        require(msg.sender == factory, "DLP: FORBIDDEN");
        // sufficient check
        token0 = _token0;
        token1 = _token1;
        soloMargin = IDolomiteAmmFactory(msg.sender).soloMargin();
        soloMarginTransferProxy = _transferProxy;

        marketId0 = uint128(ISoloMargin(soloMargin).getMarketIdByTokenAddress(token0));
        marketId1 = uint128(ISoloMargin(soloMargin).getMarketIdByTokenAddress(token1));
    }

    function token0Symbol() public view returns (string memory) {
        return IERC20(token0).symbol();
    }

    function token1Symbol() public view returns (string memory) {
        return IERC20(token1).symbol();
    }

    function pairName() external view returns (string memory) {
        return string(abi.encodePacked(token0Symbol(), "-", token1Symbol()));
    }

    function getReservesPar() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0Par;
        _reserve1 = reserve1Par;
        _blockTimestampLast = blockTimestampLast;
    }

    function getReservesWei() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        ISoloMargin _soloMargin = ISoloMargin(soloMargin);

        uint reserve0InterestIndex = _soloMargin.getMarketCurrentIndex(marketId0).supply;
        uint reserve1InterestIndex = _soloMargin.getMarketCurrentIndex(marketId1).supply;

        _reserve0 = uint112(uint(reserve0Par).mul(reserve0InterestIndex).div(INTEREST_INDEX_BASE));
        _reserve1 = uint112(uint(reserve1Par).mul(reserve1InterestIndex).div(INTEREST_INDEX_BASE));
        _blockTimestampLast = blockTimestampLast;
    }

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external lock returns (uint liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReservesPar();
        // gas savings
        ISoloMargin _soloMargin = ISoloMargin(soloMargin);
        uint balance0 = _getTokenBalancePar(_soloMargin, marketId0);
        uint balance1 = _getTokenBalancePar(_soloMargin, marketId1);
        uint amount0 = balance0.sub(_reserve0);
        uint amount1 = balance1.sub(_reserve1);

        require(
            amount0 > 0,
            "DLP: INVALID_MINT_AMOUNT_0"
        );
        require(
            amount1 > 0,
            "DLP: INVALID_MINT_AMOUNT_1"
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

        require(
            liquidity > 0,
            "DLP: INSUFFICIENT_LIQUIDITY_MINTED"
        );

        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint(reserve0Par).mul(reserve1Par);
        // reserve0 and reserve1 are up-to-date
        emit Mint(msg.sender, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to, uint toAccountNumber) external lock returns (uint amount0Wei, uint amount1Wei) {
        (uint112 _reserve0, uint112 _reserve1,) = getReservesPar();
        // gas savings
        ISoloMargin _soloMargin = ISoloMargin(soloMargin);
        uint[] memory markets = new uint[](2);
        markets[0] = marketId0;
        markets[1] = marketId1;

        // gas savings
        uint balance0 = _getTokenBalancePar(_soloMargin, markets[0]);
        uint balance1 = _getTokenBalancePar(_soloMargin, markets[1]);

        bool feeOn;
        // new scope to prevent stack-too-deep issues
        {
            uint liquidity = balanceOf[address(this)];

            uint token0Index = _soloMargin.getMarketCurrentIndex(markets[0]).supply;
            uint token1Index = _soloMargin.getMarketCurrentIndex(markets[1]).supply;

            feeOn = _mintFee(_reserve0, _reserve1);
            uint _totalSupply = totalSupply;
            // gas savings, must be defined here since totalSupply can update in _mintFee
            amount0Wei = (liquidity.mul(balance0) / _totalSupply).mul(token0Index).div(INTEREST_INDEX_BASE);
            // using balances ensures pro-rata distribution
            amount1Wei = (liquidity.mul(balance1) / _totalSupply).mul(token1Index).div(INTEREST_INDEX_BASE);
            require(
                amount0Wei > 0 && amount1Wei > 0,
                "DLP: INSUFFICIENT_LIQUIDITY_BURNED"
            );

            _burn(address(this), liquidity);
        }

        uint[] memory amounts = new uint[](2);
        amounts[0] = amount0Wei;
        amounts[1] = amount1Wei;

        ITransferProxy(soloMarginTransferProxy).transferMultipleWithMarkets(
            0,
            to,
            toAccountNumber,
            markets,
            amounts
        );

        balance0 = _getTokenBalancePar(_soloMargin, markets[0]);
        balance1 = _getTokenBalancePar(_soloMargin, markets[1]);

        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint(reserve0Par).mul(reserve1Par);

        // reserve0 and reserve1 are up-to-date
        emit Burn(msg.sender, amount0Wei, amount1Wei, to);
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
        amount : Types.AssetAmount(false, Types.AssetDenomination.Par, Types.AssetReference.Delta, amount),
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(0),
        otherAccountId : toAccountIndex,
        data : bytes("")
        });
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
        Cache memory cache;
        {
            ISoloMargin _soloMargin = ISoloMargin(soloMargin);
            cache = Cache({
            soloMargin : _soloMargin,
            marketId0 : marketId0,
            marketId1 : marketId1,
            balance0Wei : _getTokenBalanceWei(_soloMargin, marketId0),
            balance1Wei : _getTokenBalanceWei(_soloMargin, marketId1),
            index0 : _soloMargin.getMarketCurrentIndex(marketId0),
            index1 : _soloMargin.getMarketCurrentIndex(marketId1)
            });
        }

        require(
            msg.sender == address(cache.soloMargin),
            "DLP: INVALID_SENDER"
        );
        require(
            makerAccount.owner == address(this),
            "DLP: INVALID_MAKER_ACCOUNT_OWNER"
        );
        require(
            makerAccount.number == 0,
            "DLP: INVALID_MAKER_ACCOUNT_NUMBER"
        );

        require(
            token0 != takerAccount.owner && token1 != takerAccount.owner,
            "DLP: INVALID_TO"
        );

        uint amount0OutWei;
        uint amount1OutWei;
        {
            require(
                inputMarketId == cache.marketId0 || inputMarketId == cache.marketId1,
                "DLP: INVALID_INPUT_TOKEN"
            );
            require(
                outputMarketId == cache.marketId0 || outputMarketId == cache.marketId1,
                "DLP: INVALID_INPUT_TOKEN"
            );
            require(
                inputWei.sign,
                "DLP: INPUT_WEI_MUST_BE_POSITIVE"
            );

            (uint amountOutWei) = abi.decode(data, ((uint)));

            require(
                amountOutWei > 0,
                "DLP: INSUFFICIENT_OUTPUT_AMOUNT"
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

        uint amount0InWei;
        uint amount1InWei;
        {
            // gas savings
            (uint112 _reserve0, uint112 _reserve1,) = getReservesWei();
            require(
                amount0OutWei < _reserve0 && amount1OutWei < _reserve1,
                "DLP: INSUFFICIENT_LIQUIDITY"
            );

            amount0InWei = cache.balance0Wei > (_reserve0 - amount0OutWei) ? cache.balance0Wei - (_reserve0 - amount0OutWei) : 0;
            amount1InWei = cache.balance1Wei > (_reserve1 - amount1OutWei) ? cache.balance1Wei - (_reserve1 - amount1OutWei) : 0;
            require(
                amount0InWei > 0 || amount1InWei > 0,
                "DLP: INSUFFICIENT_INPUT_AMOUNT"
            );

            uint balance0Adjusted = cache.balance0Wei.mul(1000).sub(amount0InWei.mul(3));
            uint balance1Adjusted = cache.balance1Wei.mul(1000).sub(amount1InWei.mul(3));
            require(
                balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000 ** 2),
                "DLP: K"
            );

            // convert the numbers from wei to par
            _update(
                cache.balance0Wei.mul(INTEREST_INDEX_BASE).div(cache.index0.supply),
                cache.balance1Wei.mul(INTEREST_INDEX_BASE).div(cache.index1.supply),
                uint112(uint(_reserve0).mul(INTEREST_INDEX_BASE).div(cache.index0.supply)),
                uint112(uint(_reserve1).mul(INTEREST_INDEX_BASE).div(cache.index1.supply))
            );
        }

        emit Swap(msg.sender, amount0InWei, amount1InWei, amount0OutWei, amount1OutWei, takerAccount.owner);

        return Types.AssetAmount({
        sign : false,
        denomination : Types.AssetDenomination.Wei,
        ref : Types.AssetReference.Delta,
        value : amount0OutWei > 0 ? amount0OutWei : amount1OutWei
        });
    }

    // force balances to match reserves
    function skim(address to, uint toAccountNumber) external lock {
        // gas savings
        ISoloMargin _soloMargin = ISoloMargin(soloMargin);

        uint[] memory markets = new uint[](2);
        markets[0] = marketId0;
        markets[1] = marketId1;

        uint amount0 = _getTokenBalancePar(_soloMargin, markets[0]).sub(reserve0Par);
        uint amount1 = _getTokenBalancePar(_soloMargin, markets[1]).sub(reserve1Par);

        uint[] memory amounts = new uint[](2);
        amounts[0] = amount0;
        amounts[1] = amount1;

        ITransferProxy(soloMarginTransferProxy).transferMultipleWithMarkets(
            0,
            to,
            toAccountNumber,
            markets,
            amounts
        );
    }

    // force reserves to match balances
    function sync() external lock {
        ISoloMargin _soloMargin = ISoloMargin(soloMargin);
        _update(
            _getTokenBalancePar(_soloMargin, marketId0),
            _getTokenBalancePar(_soloMargin, marketId1),
            reserve0Par,
            reserve1Par
        );
    }

    // *************************
    // ***** Internal Functions
    // *************************

    /// @notice Updates reserves and, on the first call per block, price accumulators. THESE SHOULD ALL BE IN PAR
    function _update(
        uint balance0,
        uint balance1,
        uint112 reserve0,
        uint112 reserve1
    ) internal {
        require(
            balance0 <= uint112(- 1) && balance1 <= uint112(- 1),
            "DLP: OVERFLOW"
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
    ) private returns (bool feeOn) {
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
                    uint numerator = totalSupply.mul(rootK.sub(rootKLast));
                    uint denominator = rootK.mul(5).add(rootKLast);
                    uint liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    function _getTokenBalancePar(
        ISoloMargin _soloMargin,
        uint marketId
    ) internal view returns (uint) {
        return _soloMargin.getAccountPar(Account.Info(address(this), 0), marketId).value;
    }

    function _getTokenBalanceWei(
        ISoloMargin _soloMargin,
        uint marketId
    ) internal view returns (uint) {
        return _soloMargin.getAccountWei(Account.Info(address(this), 0), marketId).value;
    }

}
