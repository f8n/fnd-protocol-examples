import config from "./hardhat.config";

export default {
  ...config,
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
    ...config.paths,
    tests: "./test-mainnet-fork",
  },
};
