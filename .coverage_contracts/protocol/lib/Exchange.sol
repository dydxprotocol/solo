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

import { Require } from "./Require.sol";
import { Token } from "./Token.sol";
import { Types } from "./Types.sol";
import { IExchangeWrapper } from "../interfaces/IExchangeWrapper.sol";


/**
 * @title Exchange
 * @author dYdX
 *
 * Library for transferring tokens and interacting with ExchangeWrappers by using the Wei struct
 */
library Exchange {
function coverage_0xb745601a(bytes32 c__0xb745601a) public pure {}

    using Types for Types.Wei;

    // ============ Constants ============

    bytes32 constant FILE = "Exchange";

    // ============ Library Functions ============

    function transferOut(
        address token,
        address to,
        Types.Wei memory deltaWei
    )
        internal
    {coverage_0xb745601a(0x47ef1dc862e1eb9a0a546aa722606602da5f362b12d91581f9a3dcc7c57fe1a6); /* function */ 

coverage_0xb745601a(0x58970e93f9dae19c29c7891d53a1569b349fafb27cc610271423228fa571d9b4); /* line */ 
        coverage_0xb745601a(0x85d1e9f8bcb08da75859a9dc28ca58921040825d3fe8e65c925861b348552c67); /* statement */ 
Require.that(
            !deltaWei.isPositive(),
            FILE,
            "Cannot transferOut positive",
            deltaWei.value
        );

coverage_0xb745601a(0xec7e290a46b058484884a931dc7d8692816811c7b23e2fe99b0d9af04e707d14); /* line */ 
        coverage_0xb745601a(0x5f66521d6d307491d97581d49b493ab120c6fe96c8ff17a8e70fe242e8cd7537); /* statement */ 
Token.transfer(
            token,
            to,
            deltaWei.value
        );
    }

    function transferIn(
        address token,
        address from,
        Types.Wei memory deltaWei
    )
        internal
    {coverage_0xb745601a(0xcb3fd7cfd2054e4e2b22c05d6c802f23aff72221ccc6355ed76adb3902e052b7); /* function */ 

coverage_0xb745601a(0xfec60706902fe70d2217ddc6e8565710d433ae9cc50e2adc845d9e7520171eea); /* line */ 
        coverage_0xb745601a(0xe422fa37c988415294ba71f036b72a2e3d3f4fc52914203d332753d287e4cc7d); /* statement */ 
Require.that(
            !deltaWei.isNegative(),
            FILE,
            "Cannot transferIn negative",
            deltaWei.value
        );

coverage_0xb745601a(0x7716edcf8d941a6d2a9157480ebc253747316aaaef9416f973668dcc437a88e5); /* line */ 
        coverage_0xb745601a(0x584ee4790623b6d8ffcb8932e709f08e73c1fdfedc3be3dc21217a3e42ff14f9); /* statement */ 
Token.transferFrom(
            token,
            from,
            address(this),
            deltaWei.value
        );
    }

    function getCost(
        address exchangeWrapper,
        address supplyToken,
        address borrowToken,
        Types.Wei memory desiredAmount,
        bytes memory orderData
    )
        internal
        view
        returns (Types.Wei memory)
    {coverage_0xb745601a(0x53988cff5be63f9c5933280e6a50019b20666bc7b8c0ba3d7d8702e104a8dad5); /* function */ 

coverage_0xb745601a(0x8f02e274cc3dcf3d251e8dab3b6068f5469aaf0284dfdc896c5e48614a42b14c); /* line */ 
        coverage_0xb745601a(0xdfd341d7074882e2004ad82d2e359705bcf2bcb9d09202680d66239181c12cfc); /* statement */ 
Require.that(
            !desiredAmount.isNegative(),
            FILE,
            "Cannot getCost negative",
            desiredAmount.value
        );

coverage_0xb745601a(0x33f1719ae21c3ce7ff57c6f5e2a4c3714c5c7ae29479a76babde5a6005dd0f9b); /* line */ 
        coverage_0xb745601a(0x2cec0b332ec2e5fde72d1f19e7efc50e90cd93756d96a7ae8d6f6be9a5d171e2); /* statement */ 
Types.Wei memory result;
coverage_0xb745601a(0x0e50efd0e4f993f1240ac99b15d3493467101b58cb92b80c436258b85ad3db27); /* line */ 
        coverage_0xb745601a(0x45b09442b19e938be2336e92107c05723f95c0b896553dec0f0d172fbebf14d0); /* statement */ 
result.sign = false;
coverage_0xb745601a(0xf1719b618a67504aa53c19da2fc7850fcb47dabab0b67227edc1857d892b5725); /* line */ 
        coverage_0xb745601a(0xced0546ddb542daf42f759d330c612c59898dbb257b038dea417adca8450611c); /* statement */ 
result.value = IExchangeWrapper(exchangeWrapper).getExchangeCost(
            supplyToken,
            borrowToken,
            desiredAmount.value,
            orderData
        );

coverage_0xb745601a(0x2c1dfa63457cc01778d7fb6c61cec83bed007f7a0b1ad46471ca3b2b17045eb4); /* line */ 
        coverage_0xb745601a(0xc62abcce9b03a6cf8707b0fea1c74d45c662d76f7a0774021a2b7e68c4e2dd46); /* statement */ 
return result;
    }

    function exchange(
        address exchangeWrapper,
        address accountOwner,
        address supplyToken,
        address borrowToken,
        Types.Wei memory requestedFillAmount,
        bytes memory orderData
    )
        internal
        returns (Types.Wei memory)
    {coverage_0xb745601a(0x980586c6da87d76d69570df338348b8e4cd8a0b0f0dc6c1399e9f5bf1f45bfe8); /* function */ 

coverage_0xb745601a(0x62a408b2c5ba15ad9c89007441d728b31ed19e3f1ad7f169367881a04f308209); /* line */ 
        coverage_0xb745601a(0x9dff932fe04b3bf8589a326e661600e598b2e3ba14cb53595d6348e87f1a096c); /* statement */ 
Require.that(
            !requestedFillAmount.isPositive(),
            FILE,
            "Cannot exchange positive",
            requestedFillAmount.value
        );

coverage_0xb745601a(0x4083e84908ba5e958b499a692ac97fd281c40e3e16cf9ef032b319da5f87adcb); /* line */ 
        coverage_0xb745601a(0xbb926fd4ea01d9a7325d7f447f7ab8ace0ea4e7b498ddf92a11388de5486968f); /* statement */ 
transferOut(borrowToken, exchangeWrapper, requestedFillAmount);

coverage_0xb745601a(0x26746cc0a9e0a0877ffdfefbd8168c8b695745128f68aca59cc4c63bf9478d64); /* line */ 
        coverage_0xb745601a(0xdbd6cfb8aeb91dfeed92a13923b85cd48d34310b8e0c7b93d8453100ba769284); /* statement */ 
Types.Wei memory result;
coverage_0xb745601a(0x51cb0a1ea9d5261942ec5ce7fa9f0033b35384083bb33d095291fbd40bedef5b); /* line */ 
        coverage_0xb745601a(0xf50edd3e7895ce42c0415d405458875a36e9ced4d0fdad734e9de95b97b1f763); /* statement */ 
result.sign = true;
coverage_0xb745601a(0x6c8365449ec205e5fe1a2d0131aae16c6d9de217df22e8c65f00a805ebcec2bd); /* line */ 
        coverage_0xb745601a(0x3b47320a49de088136fc5e35202a5f32e61beab436e681b09fd52b90e1274e85); /* statement */ 
result.value = IExchangeWrapper(exchangeWrapper).exchange(
            accountOwner,
            address(this),
            supplyToken,
            borrowToken,
            requestedFillAmount.value,
            orderData
        );

coverage_0xb745601a(0x46217c1ac784b940e435d7c18911698261482b2c0d07bf9b0faf08b8241fecee); /* line */ 
        coverage_0xb745601a(0xe39e980604d625ad2bf0a4213f3a8027f6757b993b1eb36abf8d75702929b47a); /* statement */ 
transferIn(supplyToken, exchangeWrapper, result);

coverage_0xb745601a(0x0875c6db9f09b732ffcbb3de57087bf2c43f35c626d05102faea134d81f6343e); /* line */ 
        coverage_0xb745601a(0xbe77639d7c9fce5f9308822eecaac014525d4a0b9b3179ed28f28ac9fb43ae50); /* statement */ 
return result;
    }
}
