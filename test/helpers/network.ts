import { providers } from "ethers";
import { ethers } from "hardhat";

export async function increaseTime(seconds: number): Promise<void> {
  const provider: providers.JsonRpcProvider = ethers.provider;
  await provider.send("evm_increaseTime", [seconds]);
  await advanceBlock();
}

export async function advanceBlock() {
  const provider: providers.JsonRpcProvider = ethers.provider;
  await provider.send("evm_mine", []);
}
