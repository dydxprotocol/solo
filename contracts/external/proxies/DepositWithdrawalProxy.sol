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

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { WETH9 } from "canonical-weth/contracts/WETH9.sol";

import { IDolomiteMargin } from "../../protocol/interfaces/IDolomiteMargin.sol";

import { Account } from "../../protocol/lib/Account.sol";
import { Actions } from "../../protocol/lib/Actions.sol";
import { Require } from "../../protocol/lib/Require.sol";
import { Types } from "../../protocol/lib/Types.sol";

import { OnlyDolomiteMargin } from "../helpers/OnlyDolomiteMargin.sol";

import { IDepositWithdrawalProxy } from "../interfaces/IDepositWithdrawalProxy.sol";
import "../uniswap-v2/interfaces/IWETH.sol";


/**
 * @title DepositWithdrawalProxy
 * @author Dolomite
 *
 * @dev Contract for depositing or withdrawing to/from Dolomite easily. This lowers gas costs on Arbitrum by minimizing
 *      callData
 */
contract DepositWithdrawalProxy is IDepositWithdrawalProxy, OnlyDolomiteMargin, ReentrancyGuard {
    using Address for address payable;

    // ============ Constants ============

    bytes32 constant FILE = "DepositWithdrawalProxy";

    // ============ Field Variables ============

    WETH9 WETH;
    uint256 ETH_MARKET_ID;
    bool g_initialized;

    // ============ Modifiers ============

    modifier requireIsInitialized() {
        Require.that(
            g_initialized,
            FILE,
            "not initialized"
        );
        _;
    }

    // ============ Constructor ============

    constructor (
        address _dolomiteMargin
    )
    public
    OnlyDolomiteMargin(_dolomiteMargin)
    {}

    // ============ External Functions ============

    function() external payable {
        Require.that(
            msg.sender == address(WETH),
            FILE,
            "invalid ETH sender"
        );
    }

    function initializeETHMarket(
        address payable _weth
    ) external {
        Require.that(
            !g_initialized,
            FILE,
            "already initialized"
        );
        g_initialized = true;
        WETH = WETH9(_weth);
        ETH_MARKET_ID = DOLOMITE_MARGIN.getMarketIdByTokenAddress(_weth);
        WETH.approve(address(DOLOMITE_MARGIN), uint(-1));
    }

    function depositWei(
        uint _accountIndex,
        uint _marketId,
        uint _amountWei
    )
    external
    nonReentrant {
        _deposit(
            /* _from = */ msg.sender,
            _accountIndex,
            _marketId,
            Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Wei,
                ref: Types.AssetReference.Delta,
                value: _amountWei == uint(-1) ? _getSenderBalance(_marketId) : _amountWei
            })
        );
    }

    function depositETH(
        uint _accountIndex
    )
    external
    payable
    requireIsInitialized
    nonReentrant {
        _wrap();
        _deposit(
            /* _from = */ address(this),
            _accountIndex,
            ETH_MARKET_ID,
            Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Wei,
                ref: Types.AssetReference.Delta,
                value: msg.value
            })
        );
    }

    function depositWeiIntoDefaultAccount(
        uint _marketId,
        uint _amountWei
    )
    external
    nonReentrant {
        _deposit(
            /* _from = */ msg.sender,
            /* _accountIndex = */ 0,
            _marketId,
            Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Wei,
                ref: Types.AssetReference.Delta,
                value: _amountWei == uint(-1) ? _getSenderBalance(_marketId) : _amountWei
            })
        );
    }

    function depositETHIntoDefaultAccount()
    external
    payable
    requireIsInitialized
    nonReentrant {
        _wrap();
        _deposit(
            /* _from = */ address(this),
            /* _accountIndex = */ 0,
            ETH_MARKET_ID,
            Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Wei,
                ref: Types.AssetReference.Delta,
                value: msg.value
            })
        );
    }

    function withdrawWei(
        uint _accountIndex,
        uint _marketId,
        uint _amountWei
    )
    external
    nonReentrant {
        _withdraw(
            /* _to = */ msg.sender,
            _accountIndex,
            _marketId,
            Types.AssetAmount({
                sign: false,
                denomination: Types.AssetDenomination.Wei,
                ref: _amountWei == uint(-1) ? Types.AssetReference.Target : Types.AssetReference.Delta,
                value: _amountWei == uint(-1) ? 0 : _amountWei
            })
        );
    }

    function withdrawETH(
        uint _accountIndex,
        uint _amountWei
    )
    external
    requireIsInitialized
    nonReentrant {
        _withdraw(
            /* _to = */ address(this),
            _accountIndex,
            ETH_MARKET_ID,
            Types.AssetAmount({
                sign: false,
                denomination: Types.AssetDenomination.Wei,
                ref: _amountWei == uint(-1) ? Types.AssetReference.Target : Types.AssetReference.Delta,
                value: _amountWei == uint(-1) ? 0 : _amountWei
            })
        );
        _unwrapAndSend();
    }

    function withdrawWeiFromDefaultAccount(
        uint _marketId,
        uint _amountWei
    )
    external
    nonReentrant {
        _withdraw(
            /* _to = */ msg.sender,
            /* _accountIndex = */ 0,
            _marketId,
            Types.AssetAmount({
                sign: false,
                denomination: Types.AssetDenomination.Wei,
                ref: _amountWei == uint(-1) ? Types.AssetReference.Target : Types.AssetReference.Delta,
                value: _amountWei == uint(-1) ? 0 : _amountWei
            })
        );
    }

    function withdrawETHFromDefaultAccount(
        uint _amountWei
    )
    external
    requireIsInitialized
    nonReentrant {
        _withdraw(
            /* _to = */ address(this),
            0,
            ETH_MARKET_ID,
            Types.AssetAmount({
                sign: false,
                denomination: Types.AssetDenomination.Wei,
                ref: _amountWei == uint(-1) ? Types.AssetReference.Target : Types.AssetReference.Delta,
                value: _amountWei == uint(-1) ? 0 : _amountWei
            })
        );
        _unwrapAndSend();
    }

    // ========================= Par Functions =========================

    function depositPar(
        uint _accountIndex,
        uint _marketId,
        uint _amountPar
    )
    external
    nonReentrant {
        _deposit(
            /* _from = */ msg.sender,
            _accountIndex,
            _marketId,
            Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Par,
                ref: Types.AssetReference.Delta,
                value: _amountPar
            })
        );
    }

    function depositParIntoDefaultAccount(
        uint _marketId,
        uint _amountPar
    )
    external
    nonReentrant {
        _deposit(
            /* _from = */ msg.sender,
            /* _accountIndex = */ 0,
            _marketId,
            Types.AssetAmount({
                sign: true,
                denomination: Types.AssetDenomination.Par,
                ref: Types.AssetReference.Delta,
                value: _amountPar
            })
        );
    }

    function withdrawPar(
        uint _accountIndex,
        uint _marketId,
        uint _amountPar
    )
    external
    nonReentrant {
        _withdraw(
            /* _to = */ msg.sender,
            _accountIndex,
            _marketId,
            Types.AssetAmount({
                sign: false,
                denomination: Types.AssetDenomination.Par,
                ref: _amountPar == uint(-1) ? Types.AssetReference.Target : Types.AssetReference.Delta,
                value: _amountPar == uint(-1) ? 0 : _amountPar
            })
        );
    }

    function withdrawParFromDefaultAccount(
        uint _marketId,
        uint _amountPar
    )
    external
    nonReentrant {
        _withdraw(
            /* _to = */ msg.sender,
            /* _accountIndex = */ 0,
            _marketId,
            Types.AssetAmount({
                sign: false,
                denomination: Types.AssetDenomination.Par,
                ref: _amountPar == uint(-1) ? Types.AssetReference.Target : Types.AssetReference.Delta,
                value: _amountPar == uint(-1) ? 0 : _amountPar
            })
        );
    }

    // ============ Internal Functions ============

    function _wrap() internal {
        WETH.deposit.value(msg.value)();
    }

    function _unwrapAndSend() internal {
        WETH9 _WETH = WETH;
        uint amount = _WETH.balanceOf(address(this));
        _WETH.withdraw(amount);
        msg.sender.sendValue(amount);
    }

    function _getSenderBalance(uint _marketId) internal view returns (uint) {
        return IERC20(DOLOMITE_MARGIN.getMarketTokenAddress(_marketId)).balanceOf(msg.sender);
    }

    function _deposit(
        address _from,
        uint _accountIndex,
        uint _marketId,
        Types.AssetAmount memory _amount
    ) internal {
        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info({
            owner: msg.sender,
            number: _accountIndex
        });

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Deposit,
            accountId: 0,
            amount: _amount,
            primaryMarketId: _marketId,
            secondaryMarketId: 0,
            otherAddress: _from,
            otherAccountId: 0,
            data: bytes("")
        });

        DOLOMITE_MARGIN.operate(accounts, actions);
    }

    function _withdraw(
        address _to,
        uint _accountIndex,
        uint _marketId,
        Types.AssetAmount memory _amount
    ) internal {
        Account.Info[] memory accounts = new Account.Info[](1);
        accounts[0] = Account.Info({
            owner: msg.sender,
            number: _accountIndex
        });

        Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](1);
        actions[0] = Actions.ActionArgs({
            actionType: Actions.ActionType.Withdraw,
            accountId: 0,
            amount: _amount,
            primaryMarketId: _marketId,
            secondaryMarketId: 0,
            otherAddress: _to,
            otherAccountId: 0,
            data: bytes("")
        });

        DOLOMITE_MARGIN.operate(accounts, actions);
    }

}
