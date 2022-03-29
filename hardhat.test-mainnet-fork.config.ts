import { HardhatUserConfig } from "hardhat/types";
import baseConfig from "./hardhat.config";

if (!process.env[`RPC_URL_MAINNET`]) {
  throw new Error("Missing .env RPC_URL_MAINNET");
}

const config: HardhatUserConfig = {
  ...baseConfig,
  networks: {
    hardhat: {
      forking: {
        url: process.env[`RPC_URL_MAINNET`],
      },
      chainId: 1,
      gasPrice: "auto",
    },
  },
  paths: {
    ...baseConfig.paths,
    tests: "./test-mainnet-fork",
  },
};

export default config;