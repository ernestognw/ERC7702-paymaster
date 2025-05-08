import "./config";
import { vars, type HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "./hardhat/remappings";
import "./tasks/erc7702";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.drpc.org",
      accounts: [
        vars.get("PAYMASTER_PRIVATE_KEY"),
        vars.get("WALLET_PRIVATE_KEY"),
      ],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY"),
    },
  },
};

export default config;
