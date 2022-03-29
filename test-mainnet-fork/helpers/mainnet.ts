import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";

export async function resetNodeState() {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.RPC_URL_MAINNET,
        },
      },
    ],
  });
}

export async function addSomeETH(address: SignerWithAddress) {
  const balance = ethers.utils.hexStripZeros(ethers.utils.parseEther("1000").toHexString());
  await network.provider.send("hardhat_setBalance", [address.address, balance]);
}

export async function impersonate(address: string): Promise<SignerWithAddress> {
  const signer = await ethers.getSigner(address);
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [signer.address],
  });
  await addSomeETH(signer);
  return signer;
}

export async function stopImpersonate(address: SignerWithAddress) {
  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [address.address],
  });
}
