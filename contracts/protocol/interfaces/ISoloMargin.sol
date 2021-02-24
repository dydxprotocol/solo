pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import "../lib/Account.sol";
import "../lib/Interest.sol";
import "../lib/Actions.sol";

import "../Permission.sol";

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

    function operate(
        Account.Info[] calldata accounts,
        Actions.ActionArgs[] calldata actions
    ) external;

    function setOperators(
        Permission.OperatorArg[] calldata args
    ) external;

}
