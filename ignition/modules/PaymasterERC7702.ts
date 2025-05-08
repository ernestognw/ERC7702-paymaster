// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PaymasterERC7702Module = buildModule("PaymasterERC7702Module", (m) => {
  const paymasterERC7702 = m.contract("PaymasterERC7702", []);
  return { paymasterERC7702 };
});

export default PaymasterERC7702Module;
