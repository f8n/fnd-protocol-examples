import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig } from "hardhat/types";
import "hardhat-tracer";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1337,
      },
    },
  },
  networks: {
    mainnet: {
      url: process.env[`RPC_URL_MAINNET`],
    },
  },
  typechain: {
    target: "ethers-v5",
    externalArtifacts: ["node_modules/@manifoldxyz/royalty-registry-solidity/build/contracts/*.json"],
  },
  gasReporter: {
    excludeContracts: ["mocks/", "FoundationTreasury.sol", "ERC721.sol"],
  },
  mocha: {
    timeout: 1200000,
  },
};

export default config;
