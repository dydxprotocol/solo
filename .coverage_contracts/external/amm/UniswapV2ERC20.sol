pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "../../protocol/interfaces/IERC20.sol";

import "../interfaces/IUniswapV2ERC20.sol";

contract UniswapV2ERC20 is IUniswapV2ERC20 {
function coverage_0x113822a9(bytes32 c__0x113822a9) public pure {}

    using SafeMath for uint;

    string public constant name = 'Uniswap V2';
    string public constant symbol = 'UNI-V2';
    uint8 public constant decimals = 18;
    uint  public totalSupply;
    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint) public nonces;

    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    constructor() public {coverage_0x113822a9(0xae6bc5887371d34df73a9efe7305ca15d8f6694745ec32e4cc033acabb19cf3f); /* function */ 

coverage_0x113822a9(0x64122985cc879e7e89c65b2ad8fd858c2296832c6fe4f20b27431f8fff2dd053); /* line */ 
        coverage_0x113822a9(0x8ef557f81e6bf9729d7996b082c0b2f0a70d9cbd7b878a0a87a4b7129fb82359); /* statement */ 
uint chainId;
coverage_0x113822a9(0x7e5a7394a8d801c8da95d18ad05595a57dca3d34a23a757e96f5179a7b53be25); /* line */ 
        assembly {
            chainId := chainid
        }
coverage_0x113822a9(0x17fed80cb773597d92e194497ab5311313fbaa4a987e738cf0fdba3c87cffee0); /* line */ 
        coverage_0x113822a9(0xf1dd38ecd5787ff96c6eaaba3cc3ef72b44b040cb82e278ffa43ac37db9849b8); /* statement */ 
DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(name)),
                keccak256(bytes('1')),
                chainId,
                address(this)
            )
        );
    }

    function _mint(address to, uint value) internal {coverage_0x113822a9(0xc861d3364f7a8a8370e8c19e9dcdce8736ca987e184e19d81c134ebd8c2bc59b); /* function */ 

coverage_0x113822a9(0x700799abd9e1cba14e8dcc9d3291eb808074600079e2ac5a07af0f3545371f45); /* line */ 
        coverage_0x113822a9(0x1e0ee931e1599f26831fc912a4715e93aa64314e9efe5d22c5d6ed7262d4a3de); /* statement */ 
totalSupply = totalSupply.add(value);
coverage_0x113822a9(0x7b63710d7837161e39481a34860bf36f8367f0a99220d7df426d6df45acaa348); /* line */ 
        coverage_0x113822a9(0x84cc0de4edf83e7716bc154c16d863cdd7723595dff5bad45d7a1c7bb1ff5593); /* statement */ 
balanceOf[to] = balanceOf[to].add(value);
coverage_0x113822a9(0xb5742419f268b23cbae3695336aeffb85a1fb9f9e3c1cfe2c2557f517c1d707d); /* line */ 
        coverage_0x113822a9(0x9190daf34ef35bfe4b4b1e7cff8f25578d54a19b908b2a3681595ad662548338); /* statement */ 
emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint value) internal {coverage_0x113822a9(0xa0a75290333126732d088f7483e7e7faf9da484a7ac94e2fa352dadc21790d46); /* function */ 

coverage_0x113822a9(0xb29fdee807cc5e7a3883c77a34c0598517226848b7ee331a2f9266544da13842); /* line */ 
        coverage_0x113822a9(0x6ba3c8deb65f6acfc88ed471c8fb683083695ce2ae3f4c4add75de9048905f35); /* statement */ 
balanceOf[from] = balanceOf[from].sub(value);
coverage_0x113822a9(0xa10173f9b1bf9b49cbdddbdcce141ce02e1a2f48d891feff4d34c2d1e809745c); /* line */ 
        coverage_0x113822a9(0xaf72d2c1a59150995576744b017cfb226d864d0cbb36970dafbe413042a006c5); /* statement */ 
totalSupply = totalSupply.sub(value);
coverage_0x113822a9(0x8b529cd1683c3db4f57e45331d1de626ac17fefb0d2679d75ac6f7aa7218fc5b); /* line */ 
        coverage_0x113822a9(0x9408d038c8b0455da7b423b7f47bc7d09ac6a5bdb93b2a17a22bfe1a8a08992c); /* statement */ 
emit Transfer(from, address(0), value);
    }

    function _approve(address owner, address spender, uint value) private {coverage_0x113822a9(0x71746cc621358ab3350caceeb62d2bd3b0dbcf7afe284cfbb680962c8f163070); /* function */ 

coverage_0x113822a9(0x155a73cfa8e19891292053f0d7781e67af9e661ab3b13ba0fec6ea0eeb2066fe); /* line */ 
        coverage_0x113822a9(0x7c3c12beb920cebf276cbf5b1122a6bc2dc918e035feec127358a3e8a0a54f3b); /* statement */ 
allowance[owner][spender] = value;
coverage_0x113822a9(0x0b0f5f9d367111c00935f65c160c47d4ba53f7835d13ee0706e2c8585cf50718); /* line */ 
        coverage_0x113822a9(0x7f4c86193d2a3b5d6ab43d36df0091e5cc90c0603c8c0479a5ecf0e561089b81); /* statement */ 
emit Approval(owner, spender, value);
    }

    function _transfer(address from, address to, uint value) private {coverage_0x113822a9(0xad15ed76dee8026adc790ee256a73e65b328447cae45d5d952912f6247bd5c0b); /* function */ 

coverage_0x113822a9(0xd3754ea2944dbf9e9fdb391b091d65c64bbb034e5e8f5d6bbcf87513429a0391); /* line */ 
        coverage_0x113822a9(0x8be94ce2773887f07cc78000a7afdd7b2b8843b6ca64e8f0b493ca0f7f8a3415); /* statement */ 
balanceOf[from] = balanceOf[from].sub(value);
coverage_0x113822a9(0xff6748b9c8f4c898a574f21b9392ec1936ec30ae9164465f3070d18f118e20ce); /* line */ 
        coverage_0x113822a9(0x4b401b16c1cbb059e8dd4111228032605f64a849a458a5a7fa59152cd6c06b13); /* statement */ 
balanceOf[to] = balanceOf[to].add(value);
coverage_0x113822a9(0x500f3b6725358b6efdd9deebfc698bbe0065a315ab5970f5383f03b56accb751); /* line */ 
        coverage_0x113822a9(0x7a07585e9937ade602aa24b30d3af8e34b79789ee6d80764537516cdbb0556ca); /* statement */ 
emit Transfer(from, to, value);
    }

    function approve(address spender, uint value) external returns (bool) {coverage_0x113822a9(0x9171b90258775c220847a17f3d179f2beb8d49f431efa6776d4a52f9f0d32d12); /* function */ 

coverage_0x113822a9(0xcf3c4bae7d4e8ae078de11b69b69560b0ab4fd9b56d6d2415ff7583811785a7d); /* line */ 
        coverage_0x113822a9(0x7b6128250ccbc7891974aa0830ef9172c20282b58764f97ba2dec18373e899f7); /* statement */ 
_approve(msg.sender, spender, value);
coverage_0x113822a9(0x11e91252eee1a8d3e48481f629c08d91da0e200e2beb0d2a5c2bc4f4afaaf360); /* line */ 
        coverage_0x113822a9(0x06181f32249e81b5bdbb5c2bcb3ec0bf2ed4e91937be1109093cdee503e9f17a); /* statement */ 
return true;
    }

    function transfer(address to, uint value) external returns (bool) {coverage_0x113822a9(0x4fbf210dd76a9e25ae7e35fa294a0337f7f3562b29a846a7fa221c9049004208); /* function */ 

coverage_0x113822a9(0xd22be0632206009bb7291aaa427a40c87ed8cffbc0a43746de61d64e9d61ee19); /* line */ 
        coverage_0x113822a9(0xd60920f664eb843171d4f2bc7517e9d60c862dabfb851b335f849bb9fa4694a3); /* statement */ 
_transfer(msg.sender, to, value);
coverage_0x113822a9(0x6ff2a323c969b2b7bc26dd64ee3e09275d731fac316b8ca105be17ecb53a1915); /* line */ 
        coverage_0x113822a9(0xcae70be910b838a09a68e36fcb3f31046375f4e8d84f5aecdedb8149de3feb2b); /* statement */ 
return true;
    }

    function transferFrom(address from, address to, uint value) external returns (bool) {coverage_0x113822a9(0xe55dd0fe0174e03ba9b201bb93b25bb9a559a7fefcccc13316f8d983f9e70c8b); /* function */ 

coverage_0x113822a9(0x33f2ce318ff89a6b44f04fdf7177e2cb3dbb6d80ccfc2c341622fd2ae763c799); /* line */ 
        coverage_0x113822a9(0x2132be6e40f684e717683b6227855074d72f33b715db986cd3c6c20ef17e6792); /* statement */ 
if (allowance[from][msg.sender] != uint(-1)) {coverage_0x113822a9(0x225516b27e6731dda26a1f1be6880c16563836f6159788e04ccf6f28b51328a7); /* branch */ 

coverage_0x113822a9(0xb5995a3b85b04b9e4c07b57fbbfdf01a372c3fc6f57868ad402d26bd76b16f06); /* line */ 
            coverage_0x113822a9(0x390a5933199f8c437ee16530a867be0ab70064641a76241680aab026f6101f1d); /* statement */ 
allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
        }else { coverage_0x113822a9(0x6d3cd18f8860d681c667afe40a1f6210f61fbc142133d3ff07eaad805bbda4c9); /* branch */ 
}
coverage_0x113822a9(0xda60c3ffa1b7ce2ae545d674a979c38912b2f2c2f9f5a7558ecd357e01079323); /* line */ 
        coverage_0x113822a9(0x7c9f6b85b9ffeeefe41db72567d5a730f4c76938af6fe6950f8665120231815f); /* statement */ 
_transfer(from, to, value);
coverage_0x113822a9(0xeec93f92066d88712a186ef3b561be63c5091562def4f3f2c207477859b88dc7); /* line */ 
        coverage_0x113822a9(0x6b15861ba09bae8951d07ef7d90ab7b96c38291c5d60e70f9ea7ec96109419f3); /* statement */ 
return true;
    }

    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external {coverage_0x113822a9(0xff65d9aed5b943c7f5dea065ce906aaff5e9c99a02d1dfcf70d0889b1dbdc65a); /* function */ 

coverage_0x113822a9(0x75617a92acbc3d15dc70191f6efd6b69817e20a5eb7cf95ac019ea9fdd391e21); /* line */ 
        coverage_0x113822a9(0xc38c767136a1c23b950942e6f71054fe75d62ba8f4cceb1b9ff6db66aef24e79); /* assertPre */ 
coverage_0x113822a9(0x69438de8b9111b46233c4172485630ad510d507d1b226b02f9aef7602e9a1e16); /* statement */ 
require(deadline >= block.timestamp, 'UniswapV2: EXPIRED');coverage_0x113822a9(0x3621fbaa2d6f0f95c2ebbe5b1bb3bcebdc4cbf3086774306f15266d4bf60f11a); /* assertPost */ 

coverage_0x113822a9(0x69faa450431f70193b131b2c1b47b269efcf6ef4645decaf99ab21e340842073); /* line */ 
        coverage_0x113822a9(0x61780eab8e0ae85c1a6c6f66249cb37b0579d68acbe77b42e6949df23e82d391); /* statement */ 
bytes32 digest = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
            )
        );
coverage_0x113822a9(0xab5c2e9a7cba6fcf5756371b7acf2915cc30164d7b53ec66af56758c3b6b24a6); /* line */ 
        coverage_0x113822a9(0xafb71bfc481ea45348f50c70d6b836a0d04c3c627d1831ff7497a1101b8619fb); /* statement */ 
address recoveredAddress = ecrecover(digest, v, r, s);
coverage_0x113822a9(0x0b30e6f850344dbffbba64b10e05b5c70fea6f302c463b82c0126deb2b370439); /* line */ 
        coverage_0x113822a9(0xf8faca5b1a2925ddac4141f02572d49ef6ffa0c9595a11364950e8f631f54795); /* assertPre */ 
coverage_0x113822a9(0x4653f7e1e3fe6e925b4d165cb6178d8ba2bd8e5fa2aaf3da46088cd07eecf45f); /* statement */ 
require(recoveredAddress != address(0) && recoveredAddress == owner, 'UniswapV2: INVALID_SIGNATURE');coverage_0x113822a9(0xfdb5f74b0730d7e6fee84bd66199a35c61be5c30844c1974245c8d767a09ef3c); /* assertPost */ 

coverage_0x113822a9(0xe2faef5c933e444459a87b982ff7a1a169f2dc935f75d09fc3a6c54a5ed8c1b6); /* line */ 
        coverage_0x113822a9(0xd74787aa4eecceacf2d9fceb886162f9b6ec828daa210bdd007b74ee95ec4d0a); /* statement */ 
_approve(owner, spender, value);
    }
}
