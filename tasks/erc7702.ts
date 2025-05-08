import { task } from "hardhat/config";
import {
  Address,
  createWalletClient,
  encodeFunctionData,
  encodePacked,
  getAddress,
  getContract,
  Hex,
  http,
} from "viem";
import EntrypointV08Abi from "../config/EntrypointV08.abi";
import AccountERC7702Module from "../ignition/modules/AccountERC7702";
import { wallet, paymaster } from "../config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ENTRYPOINT_V08 } from "../utils/erc4337";
import { PackedUserOperation } from "viem/_types/account-abstraction/types/userOperation";
import PaymasterERC7702Module from "../ignition/modules/PaymasterERC7702";
import { encodeBatch, encodeMode } from "../utils/erc7579";

const setup = async (hre: HardhatRuntimeEnvironment) => {
  const publicClient = await hre.viem.getPublicClient();
  const [walletClient, paymasterClient] = [
    createWalletClient({
      account: wallet,
      chain: publicClient.chain,
      transport: http(),
    }),
    createWalletClient({
      account: paymaster,
      chain: publicClient.chain,
      transport: http(),
    }),
  ];

  const [{ accountERC7702 }, { paymasterERC7702 }] = await Promise.all([
    hre.ignition.deploy(AccountERC7702Module),
    hre.ignition.deploy(PaymasterERC7702Module),
  ]);

  const [walletAuthorization, paymasterAuthorization] = await Promise.all([
    walletClient.signAuthorization({
      contractAddress: accountERC7702.address,
    }),
    paymasterClient.signAuthorization({
      contractAddress: paymasterERC7702.address,
      executor: "self",
    }),
  ]);

  const entrypoint = getContract({
    abi: EntrypointV08Abi,
    address: ENTRYPOINT_V08,
    client: walletClient,
  });

  const nonce = await entrypoint.read.getNonce([wallet.address, 0n]);

  return {
    publicClient,
    paymasterClient,
    walletClient,
    accountERC7702,
    walletAuthorization,
    paymasterAuthorization,
    entrypoint,
    nonce,
  };
};

const now = Math.floor(Date.now() / 1000);
const validAfter = now - 60; // Valid from 1 minute ago
const validUntil = now + 3600; // Valid for 1 hour
const paymasterVerificationGasLimit = 100_000n;
const paymasterPostOpGasLimit = 300_000n;

const prepareUserOp = async (
  sender: Address,
  nonce: bigint,
  data: Hex
): Promise<PackedUserOperation> => {
  const userOp = {
    sender,
    nonce,
    initCode: "0x" as Hex,
    callData: data,
    accountGasLimits: encodePacked(
      ["uint128", "uint128"],
      [
        100_000n, // verificationGas
        300_000n, // callGas
      ]
    ),
    preVerificationGas: 1n,
    gasFees: encodePacked(
      ["uint128", "uint128"],
      [
        1n, // maxPriorityFeePerGas
        1n, // maxFeePerGas
      ]
    ),
    paymasterAndData: "0x" as Hex,
    signature: "0x" as Hex,
  };

  return userOp;
};

task("erc7702Paymaster", "EOA sponsors EOA", async (_, hre) => {
  const {
    publicClient,
    paymasterClient,
    walletClient,
    accountERC7702,
    walletAuthorization,
    paymasterAuthorization,
    entrypoint,
    nonce,
  } = await setup(hre);

  const userOp = await prepareUserOp(
    walletClient.account.address,
    nonce,
    encodeFunctionData({
      abi: accountERC7702.abi,
      functionName: "execute",
      args: [
        encodeMode(),
        encodeBatch({
          target: getAddress("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"), // vitalik.eth
          value: 0n,
          data: "0x",
        }),
      ],
    })
  );

  const paymasterSignature = await paymaster.signTypedData({
    domain: {
      chainId: await paymasterClient.getChainId(),
      name: "MyPaymasterERC7702",
      verifyingContract: paymasterClient.account.address,
      version: "1",
    },
    types: {
      UserOperationRequest: [
        { name: "sender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "initCode", type: "bytes" },
        { name: "callData", type: "bytes" },
        { name: "accountGasLimits", type: "bytes32" },
        { name: "preVerificationGas", type: "uint256" },
        { name: "gasFees", type: "bytes32" },
        { name: "paymasterVerificationGasLimit", type: "uint256" },
        { name: "paymasterPostOpGasLimit", type: "uint256" },
        { name: "validAfter", type: "uint48" },
        { name: "validUntil", type: "uint48" },
      ],
    },
    primaryType: "UserOperationRequest",
    message: {
      sender: userOp.sender,
      nonce: userOp.nonce,
      initCode: userOp.initCode,
      callData: userOp.callData,
      accountGasLimits: userOp.accountGasLimits,
      preVerificationGas: userOp.preVerificationGas,
      gasFees: userOp.gasFees,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
      validAfter: validAfter,
      validUntil: validUntil,
    },
  });

  userOp.paymasterAndData = encodePacked(
    ["address", "uint128", "uint128", "bytes"],
    [
      paymasterClient.account.address,
      paymasterVerificationGasLimit,
      paymasterPostOpGasLimit,
      encodePacked(
        ["uint48", "uint48", "bytes"],
        [validAfter, validUntil, paymasterSignature]
      ),
    ]
  );

  const userOpHash = await entrypoint.read.getUserOpHash([userOp]);
  userOp.signature = await wallet.sign({ hash: userOpHash });

  const receipt = await paymasterClient
    .writeContract({
      authorizationList: [walletAuthorization, paymasterAuthorization],
      abi: EntrypointV08Abi,
      functionName: "handleOps",
      args: [[userOp], paymasterClient.account.address],
      address: entrypoint.address,
    })
    .then((txHash) =>
      publicClient.waitForTransactionReceipt({
        hash: txHash,
      })
    );

  console.log(receipt);
});
