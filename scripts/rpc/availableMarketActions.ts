/*
 * An example of how to query the current state of an NFT on Foundation and which actions are available to users.
 * This script uses our "middleware" contract to query state in a single call, but the same information is available
 * via direct calls to the market contract.
 *
 * Run with `yarn run-script scripts/rpc/availableMarketActions.ts --network mainnet`
 */

import { ethers } from "hardhat";
import { FNDMiddleware__factory } from "../../typechain-types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const addresses = require("@f8n/fnd-protocol/addresses.js");

// The example NFT to query for, this should be updated with the NFT of interest
const collection = "0xfb856F0AeD8b23dcED99484031f8FE471b36B0C7";
const tokenId = 3;

async function main(): Promise<void> {
  // Connect to the Foundation middleware contract
  const middleware = FNDMiddleware__factory.connect(addresses.prod[1].middleware, ethers.provider);

  const nftDetails = await middleware.getNFTDetails(collection, tokenId);

  // Auction state
  if (nftDetails.auctionPrice.eq(0)) {
    console.log(`No auction found`);
  } else if (nftDetails.auctionEndTime.eq(0)) {
    console.log(
      `An auction is listed with a reserve price of ${ethers.utils.formatEther(nftDetails.auctionPrice)} ETH`,
    );
  } else {
    const currentTime = (await ethers.provider.getBlock("latest")).timestamp;
    if (nftDetails.auctionEndTime.gt(currentTime)) {
      console.log(
        `An auction is in progress with the highest bid of ${ethers.utils.formatEther(
          nftDetails.auctionPrice,
        )} ETH from ${nftDetails.auctionBidder}`,
      );
    } else {
      console.log(
        `The auction has ended, selling to ${nftDetails.auctionBidder} for ${ethers.utils.formatEther(
          nftDetails.auctionPrice,
        )} ETH, and is pending finalization (settle auction)`,
      );
    }
  }

  // Buy price
  if (nftDetails.buyPrice.lt(ethers.constants.MaxUint256)) {
    console.log(`The NFT may be bought for ${ethers.utils.formatEther(nftDetails.buyPrice)} ETH`);
  } else {
    console.log(`No buy price found`);
  }

  // Offer
  if (nftDetails.offerAmount.gt(0)) {
    console.log(
      `There's an offer to purchase this NFT for ${ethers.utils.formatEther(nftDetails.offerAmount)} ETH from ${
        nftDetails.offerBuyer
      } which expires at ${nftDetails.offerExpiration}`,
    );
  } else {
    console.log(`No valid (unexpired) offer found`);
  }

  // Single string for debugging purposes
  console.log(await middleware.getNFTDetailString(collection, tokenId));
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
