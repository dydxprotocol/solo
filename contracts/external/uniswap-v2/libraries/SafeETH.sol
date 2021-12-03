pragma solidity ^0.5.4;

library SafeETH {
    function safeTransferETH(address to, uint value) internal {
        (bool success,) = to.call.value(value)(new bytes(0));
        require(success, 'SafeETH: ETH_TRANSFER_FAILED');
    }
}
