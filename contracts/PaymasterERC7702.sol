// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {PaymasterSigner} from "@openzeppelin/community-contracts/account/paymaster/PaymasterSigner.sol";
import {SignerERC7702} from "@openzeppelin/community-contracts/utils/cryptography/SignerERC7702.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract PaymasterERC7702 is PaymasterSigner, SignerERC7702, Ownable {
    constructor() EIP712("MyPaymasterERC7702", "1") Ownable(address(this)) {}

    function _authorizeWithdraw() internal virtual override onlyOwner {}

    receive() external payable virtual {}
}
