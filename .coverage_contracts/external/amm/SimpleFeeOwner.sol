pragma solidity =0.5.16;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "../../protocol/interfaces/ISoloMargin.sol";
import "../../protocol/lib/Account.sol";
import "../../protocol/lib/Actions.sol";

import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";

contract SimpleFeeOwner is Ownable {
function coverage_0x5ec6288b(bytes32 c__0x5ec6288b) public pure {}


    using SafeERC20 for IERC20;

    event OwnershipChanged(address indexed newOwner, address indexed oldOwner);

    IUniswapV2Factory uniswapFactory;
    ISoloMargin soloMargin;

    constructor(
        address _uniswapFactory,
        address _soloMargin
    ) public {coverage_0x5ec6288b(0x6a7f5625c50cdf8fbea8fe2b047dc19f56dae51ea7f0f5be7a8f5a40943660a6); /* function */ 

coverage_0x5ec6288b(0x457e628baa729f023142a021fe79f9d6d3be96106efebc6f0cb80c827fc88f25); /* line */ 
        coverage_0x5ec6288b(0xc5f59b0f73d64c968a817a3d84c1aee4b5bf2bcbf05d1a83b1a8f0becdc1390c); /* statement */ 
uniswapFactory = IUniswapV2Factory(_uniswapFactory);
coverage_0x5ec6288b(0xbb37d83d682e29d6f6456a7ad32e71cab2ad22c212c783cc803c1a92466f934a); /* line */ 
        coverage_0x5ec6288b(0xb9416bc06e1a91187d40fb726185e75173206d21136095c1f0ca277bec9760da); /* statement */ 
soloMargin = ISoloMargin(_soloMargin);
    }

    function uniswapSetFeeTo(
        address feeTo
    )
    external
    onlyOwner {coverage_0x5ec6288b(0x8e3a1fd9004d56e0294faee2d542d369f9542bddc7687c11153b41625a95fd58); /* function */ 

coverage_0x5ec6288b(0x84275740f37c4328377f09695517c2c488a04342d29d384bbf5d1b3d2d0b6daf); /* line */ 
        coverage_0x5ec6288b(0x0796b54d9c8195c975011a7aff98f1a4c3874696c5d60f4a6619b57b89248e5f); /* statement */ 
uniswapFactory.setFeeTo(feeTo);
    }

    function uniswapSetFeeToSetter(
        address feeToSetter
    )
    external
    onlyOwner {coverage_0x5ec6288b(0x184875eed22e6c08872d2026dd833d784a12c44bca6a0a2deaaa6ea83b7894a1); /* function */ 

coverage_0x5ec6288b(0xeaad6812eea6934e63eecf56abbfc7701331fb8f5f4a24f7c24e72291f84ceaa); /* line */ 
        coverage_0x5ec6288b(0x50a5a5f8ca8c6c3ebfebd3c25f0b267d888d34bd15a02251e01cf1c5f119170f); /* statement */ 
uniswapFactory.setFeeToSetter(feeToSetter);
    }

    function withdrawAllFeesByTokens(
        address recipient,
        address[] calldata tokens
    )
    external
    onlyOwner {coverage_0x5ec6288b(0x45a0027bec100b7cd742795310e06e36184530c42958f29e05be178adbb1dfd2); /* function */ 

coverage_0x5ec6288b(0xfeae47a1deed3c94179caa4aaa063fa05fe044ee3706d8d5b0443ea09ada0f7b); /* line */ 
        coverage_0x5ec6288b(0x211dfd004bb3e96e3e49a53d271dddddff5c069cb2c9b42d50346bf4c3e05bc8); /* statement */ 
for (uint i = 0; i < tokens.length; i++) {
coverage_0x5ec6288b(0x95a68f63f262820ea273a27d02277b82e129ccacfcd615b631ea4f8d5a103110); /* line */ 
            coverage_0x5ec6288b(0x9c149a008e12bba8f22abbf6c36a733f77b9c735767fcf00270f75ab2e6366c5); /* statement */ 
address token = tokens[i];
coverage_0x5ec6288b(0x78a7d79102f2d229317954d112057773b4fade2d14342225168ad6e699ec9d6d); /* line */ 
            coverage_0x5ec6288b(0x684edb9c62b5cf3d8a4c331352e44423e8ccd9e7496aba6cdd1c1e3e85e76b12); /* statement */ 
uint amount = IERC20(token).balanceOf(address(this));
coverage_0x5ec6288b(0x5bcaa20ebc9d5a2520113983ceff6c8be6f8d34e54e8efb33e43c40763f9ff2f); /* line */ 
            coverage_0x5ec6288b(0xe9d333df235cd4afe2280727d68b635765678f55a4f241bc6aba86534f18d300); /* statement */ 
IERC20(token).safeTransfer(recipient, amount);
        }
    }

    function unwrapAllFeesByLpTokens(
        address recipient,
        address[] calldata lpTokens
    )
    external
    onlyOwner {coverage_0x5ec6288b(0x231d619c375b58105e5a9d4a95ea5f0c498193e39231e22776c36b4908758682); /* function */ 

coverage_0x5ec6288b(0x52cf978d5c188ce326a243664235254b094099a071ab9315ac9a491a4b6e31c5); /* line */ 
        coverage_0x5ec6288b(0xcfd839c79d991ed329b1285a5aaa0020271772e9872eb357850ea65612f3e680); /* statement */ 
for (uint i = 0; i < lpTokens.length; i++) {
coverage_0x5ec6288b(0x4b08ce60a3ec846a3387a1b9c08f1b3a22f1bb2f5d9f9336230f7c0f579c15e5); /* line */ 
            coverage_0x5ec6288b(0xbed4fe9b20a5b8a8505453ea67c3815edca972b2ba526b33880ac7c91286d9ac); /* statement */ 
IUniswapV2Pair lpToken = IUniswapV2Pair(lpTokens[i]);
coverage_0x5ec6288b(0xa50026eccea6418356851d41c6d7279627221cb2f673c4414ab207623c37a983); /* line */ 
            coverage_0x5ec6288b(0xc75c26495d5fd5dfd8dc20a6e916f907dae031e01aaff06f44cc25ce145b343c); /* statement */ 
lpToken.transfer(address(lpToken), lpToken.balanceOf(address(this)));
coverage_0x5ec6288b(0xce7fa3382d505d10d2e9a31f597d75102ed8777f7aa3a1c8f166afcaa7d6d5af); /* line */ 
            coverage_0x5ec6288b(0xe3f4a48bfa5b569381527b9d2664d5e77f3137db23d0a405ccc1027ca233e306); /* statement */ 
lpToken.burn(address(this), 0);

coverage_0x5ec6288b(0x6545a7c8fe60082c73cec634920777a3e1d1072507f7e0193b66d1949d1f0cda); /* line */ 
            coverage_0x5ec6288b(0x345b7902ab374b6f46730518abe6ae7a7ec5060bd6eadb1f04ac323e73dd9378); /* statement */ 
address token0 = lpToken.token0();
coverage_0x5ec6288b(0x3a7c0d0b6eaf1a52cd884adc9a5bba18905eff95e9036a911a8d58d4c2edb636); /* line */ 
            coverage_0x5ec6288b(0x4c1c049399fb74914b7cf4373bec085b8e9025f30a596bba067ce61c0217302e); /* statement */ 
address token1 = lpToken.token1();

coverage_0x5ec6288b(0x12c22541f5eb5b021ccd12db7d8bac5a07ef7de0079034d25ac12db22b63a2af); /* line */ 
            coverage_0x5ec6288b(0xfd15970d788441325d66bd239d2a137b70836fbc8b1024f5fbae9c9ec88f6430); /* statement */ 
uint marketId0 = soloMargin.getMarketIdByTokenAddress(token0);
coverage_0x5ec6288b(0xbe8e1f885df6e3291acf9d838792dcb074e41277f2a9b165a018666b56a793d8); /* line */ 
            coverage_0x5ec6288b(0x8438996f603c9b9000c608fb6ad4a637c49ad33c2d8a735e2f8f43bb4f23e87d); /* statement */ 
uint marketId1 = soloMargin.getMarketIdByTokenAddress(token1);

coverage_0x5ec6288b(0x2e2dc821be374b1460cd7388b8bbb96d7431903bf0c75f35507b4e3afd8024c7); /* line */ 
            coverage_0x5ec6288b(0x0e61954a6a43a6dc60bde9be10f8b3afc63a562686774d3956e1ed8c2058b6fc); /* statement */ 
Account.Info[] memory accounts = new Account.Info[](1);
coverage_0x5ec6288b(0x19af4a4c77e1e1302b1551ee2a334537c659a69f072e28226eecfef3127a98f5); /* line */ 
            coverage_0x5ec6288b(0x7b30a2e0201c6be4be72c3401fc04f2795df0a5516be2be0dff6e250ebf8084c); /* statement */ 
accounts[0] = Account.Info(address(this), 0);

coverage_0x5ec6288b(0x50c3c4b5b235df8a798329d2e8991d616a42c321e279ec2d9ddc4159600f7b8b); /* line */ 
            coverage_0x5ec6288b(0xc95e4389b64fc99df1314556b367b28b5eca0bbdfc309736d1fbd3af9d545b1b); /* statement */ 
Actions.ActionArgs[] memory actions = new Actions.ActionArgs[](2);
coverage_0x5ec6288b(0x72213e9ccc5294d4e130478c4cc70051bf17a27cd87721ed9f3c81dce15b1b9f); /* line */ 
            coverage_0x5ec6288b(0xf4ae8b2ff2e24324d33254849d36d15d7cf7c9d209e51f7840523135264ca939); /* statement */ 
actions[0] = _encodeWithdrawAllToThisContract(marketId0);
coverage_0x5ec6288b(0x73928587b2dd42650062b2dcaa3225a91afe2ea7e12ed478c392769a09e8ac30); /* line */ 
            coverage_0x5ec6288b(0x6af679e0da27631e2cb83c6fde6a177f847fd3c4cb3381f2d796c5f9d3db7fe2); /* statement */ 
actions[1] = _encodeWithdrawAllToThisContract(marketId1);

coverage_0x5ec6288b(0xeb5756c200961759f831749abe375338288c54ac07cdd09b0069ef87ae5aa844); /* line */ 
            coverage_0x5ec6288b(0x64052bbf5284b9390be4ab50dbdd0001e4f24998f9257adaca7b115fbb6a5116); /* statement */ 
soloMargin.operate(accounts, actions);

coverage_0x5ec6288b(0x97b68af6b2fe58d88d27b436046ea095de8ae1657151e674712bbbb5e08cf049); /* line */ 
            coverage_0x5ec6288b(0xf9a375b4aa4a4428fce53fe53d41e465161338d73453045b84de7848f55456f3); /* statement */ 
IERC20(token0).safeTransfer(recipient, IERC20(token0).balanceOf(address(this)));
coverage_0x5ec6288b(0xd44e359660c48309f939358db9c9e4d613015c3ddb8918dec37f128e56fb8c25); /* line */ 
            coverage_0x5ec6288b(0x0c560ac169949b38ae33f85b6524e42f3fc873dad7a7640d39131f961172873c); /* statement */ 
IERC20(token1).safeTransfer(recipient, IERC20(token1).balanceOf(address(this)));
        }
    }

    function _encodeWithdrawAllToThisContract(
        uint marketId
    ) internal view returns (Actions.ActionArgs memory) {coverage_0x5ec6288b(0x11444746befb860524ee1789bd288a32b1dbd0ea752ae64bfbd8ef9279772858); /* function */ 

coverage_0x5ec6288b(0x973e3e793c48a2e2e810caa9c94e3fed08005f0ec818a81d4e7294214447fb85); /* line */ 
        coverage_0x5ec6288b(0xecca38724b18b8620a52e200177e86b0e8125dfc892adb40d5673540fe39c67d); /* statement */ 
return Actions.ActionArgs({
        actionType : Actions.ActionType.Withdraw,
        accountId : 0,
        amount : Types.AssetAmount(true, Types.AssetDenomination.Wei, Types.AssetReference.Target, 0),
        primaryMarketId : marketId,
        secondaryMarketId : uint(- 1),
        otherAddress : address(this),
        otherAccountId : uint(- 1),
        data : bytes("")
        });
    }

}
