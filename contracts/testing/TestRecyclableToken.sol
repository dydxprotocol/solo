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

pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import { RecyclableTokenProxy } from "../external/proxies/RecyclableTokenProxy.sol";


contract TestRecyclableToken is RecyclableTokenProxy {

    bytes32 internal constant FILE = "TestRecyclableTokenProxy";

    constructor (
        address dolomiteMargin,
        address token,
        address expiry,
        uint expirationTimestamp
    )
    public
    RecyclableTokenProxy(dolomiteMargin, token, expiry, expirationTimestamp)
    {}

}
