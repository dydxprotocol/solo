// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IArbitrumSys.sol";


/**
 * @title ArbitrumMultiCall - Aggregate results from multiple read-only function calls
 * @author Michael Elliot <mike@makerdao.com>
 * @author Joshua Levine <joshua@makerdao.com>
 * @author Nick Johnson <arachnid@notdot.net>
 * @author Corey Caplan <corey@dolomite.io>
 * @dev This multi call contract is almost the same as the ordinary one, with minor adjustments for Arbitrum. See:
 *      https://developer.offchainlabs.com/docs/time_in_arbitrum#case-study-multicall for more information.
 */
contract ArbitrumMultiCall {

    struct Call {
        address target;
        bytes callData;
    }

    function aggregate(Call[] memory calls) public returns (uint256 blockNumber, bytes[] memory returnData) {
        blockNumber = IArbitrumSys(address(100)).arbBlockNumber();
        returnData = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            // solium-disable-next-line security/no-low-level-calls
            (bool success, bytes memory result) = calls[i].target.call(calls[i].callData);
            if (!success) {
                if (result.length < 68) {
                    string memory targetString = _addressToString(calls[i].target);
                    revert(string(abi.encodePacked("Multicall::aggregate: revert at <", targetString, ">")));
                } else {
                    // solium-disable-next-line security/no-inline-assembly
                    assembly {
                        result := add(result, 0x04)
                    }
                    string memory targetString = _addressToString(calls[i].target);
                    revert(
                        string(
                            abi.encodePacked(
                                "Multicall::aggregate: revert at <",
                                targetString,
                                "> with reason: ",
                                abi.decode(result, (string))
                            )
                        )
                    );
                }
            }
            returnData[i] = result;
        }
    }

    // Helper functions
    function getEthBalance(address addr) public view returns (uint256 balance) {
        balance = addr.balance;
    }

    function getBlockHash(uint256 blockNumber) public view returns (bytes32 blockHash) {
        blockHash = blockhash(blockNumber);
    }

    function getLastBlockHash() public view returns (bytes32 blockHash) {
        blockHash = blockhash(IArbitrumSys(address(100)).arbBlockNumber() - 1);
    }

    function getCurrentBlockTimestamp() public view returns (uint256 timestamp) {
        timestamp = block.timestamp;
    }

    function getCurrentBlockDifficulty() public view returns (uint256 difficulty) {
        difficulty = block.difficulty;
    }

    function getCurrentBlockGasLimit() public view returns (uint256 gaslimit) {
        gaslimit = block.gaslimit;
    }

    function getCurrentBlockCoinbase() public view returns (address coinbase) {
        coinbase = block.coinbase;
    }

    function getBlockNumber() public view returns (uint256 blockNumber) {
        blockNumber = IArbitrumSys(address(100)).arbBlockNumber();
    }

    function getL1BlockNumber() public view returns (uint256 l1BlockNumber) {
        l1BlockNumber = block.number;
    }

    function _addressToString(address _address) internal pure returns(string memory) {
        bytes32 _bytes = bytes32(uint256(_address));
        bytes memory HEX = "0123456789abcdef";
        bytes memory _string = new bytes(42);
        _string[0] = "0";
        _string[1] = "x";
        for (uint i = 0; i < 20; i++) {
            _string[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
            _string[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
        }
        return string(_string);
    }
}
