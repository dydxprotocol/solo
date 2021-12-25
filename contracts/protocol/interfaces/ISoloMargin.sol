pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import "../lib/Account.sol";
import "../lib/Actions.sol";
import "../lib/Interest.sol";
import "../lib/Monetary.sol";
import "../lib/Types.sol";

interface ISoloMargin {

    function getMarketIdByTokenAddress(
        address token
    ) external view returns (uint256);

    function getMarketTokenAddress(
        uint256 marketId
    ) external view returns (address);

    function getMarketCurrentIndex(
        uint256 marketId
    ) external view returns (Interest.Index memory);

    function getAccountPar(
        Account.Info calldata account,
        uint256 marketId
    ) external view returns (Types.Par memory);

    function getAccountWei(
        Account.Info calldata account,
        uint256 marketId
    ) external view returns (Types.Wei memory);

    function operate(
        Account.Info[] calldata accounts,
        Actions.ActionArgs[] calldata actions
    ) external;

    function setOperators(
        Types.OperatorArg[] calldata args
    ) external;

    function getIsLocalOperator(
        address owner,
        address operator
    ) external view returns (bool);

    function getAccountStatus(
        Account.Info calldata account
    ) external view returns (Account.Status);

    function getAccountMarketsWithNonZeroBalances(
        Account.Info calldata account
    ) external view returns (uint256[] memory);

    function getNumberOfMarketsWithBorrow(
        Account.Info calldata account
    ) external view returns (uint256);

    function getMarketPrice(
        uint256 marketId
    ) external view returns (Monetary.Price memory);

    function getNumMarkets() external view returns (uint256);

    function getMarginRatio() external view returns (Decimal.D256 memory);

    function getLiquidationSpreadForPair(
        uint256 heldMarketId,
        uint256 owedMarketId
    ) external view returns (Decimal.D256 memory);

}
