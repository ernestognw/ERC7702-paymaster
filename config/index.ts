import { vars } from "hardhat/config";
import { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const wallet = privateKeyToAccount(
  vars.get("WALLET_PRIVATE_KEY") as Hex
);
export const paymaster = privateKeyToAccount(
  vars.get("PAYMASTER_PRIVATE_KEY") as Hex
);
