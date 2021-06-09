pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";

import "../interfaces/IUniswapV2Factory.sol";

import "./UniswapV2Pair.sol";
import "../../protocol/Permission.sol";
import "../../protocol/Permission.sol";
import "../../protocol/Permission.sol";

contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo;
    address public feeToSetter;
    address public soloMargin;
    address public transferProxy;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    mapping(address => bool) public isPairCreated;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(
        address _feeToSetter,
        address _soloMargin,
        address _transferProxy
    ) public {
        feeToSetter = _feeToSetter;
        soloMargin = _soloMargin;
        transferProxy = _transferProxy;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function getPairInitCode() public pure returns (bytes memory) {
        return type(UniswapV2Pair).creationCode;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "DolomiteAmm: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "DolomiteAmm: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "DolomiteAmm: PAIR_EXISTS");
        // single check is sufficient
        bytes memory bytecode = getPairInitCode();
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(token0, token1, transferProxy);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        isPairCreated[pair] = true;
        // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "DolomiteAmm: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "DolomiteAmm: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }
}
