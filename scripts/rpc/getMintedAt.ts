/*
 * An example of how to query the the time an NFT was minted using RPC (e.g. Alchemy) requests.
 * Run with `yarn run-script scripts/rpc/getMintedAt.ts --network mainnet`
 *
 * See `scripts/subgraph/getMintedAt.ts` for an alternative approach to querying this value.
 */

import { ethers } from "hardhat";
import { IERC721__factory } from "../../typechain-types";

// The example NFT to query for, this should be updated with the NFT of interest
const collection = "0x3B3ee1931Dc30C1957379FAc9aba94D1C48a5405";
const tokenId = 105912;

async function main(): Promise<void> {
  const nft = IERC721__factory.connect(collection, ethers.provider);

  const mintedEvents = await nft.queryFilter(nft.filters.Transfer(ethers.constants.AddressZero, undefined, tokenId));
  if (mintedEvents.length === 0) {
    console.log(`No mint events found for ${collection} #${tokenId}`);
    return;
  }

  // It is possible for an NFT to be burned and then minted again, in that case only the most recent mint is relevant.
  const mostRecentMint = mintedEvents[mintedEvents.length - 1];
  const mintedAt = (await ethers.provider.getBlock(mostRecentMint.blockNumber)).timestamp;

  console.log(`NFT ${collection} #${tokenId} was minted at ${mintedAt}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
