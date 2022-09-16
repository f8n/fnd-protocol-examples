/*
 * An example of how to query the Foundation sale history of an NFT using RPC (e.g. Alchemy) requests.
 * Run with `yarn run-script scripts/rpc/getSaleHistory.ts --network mainnet`
 *
 * See `scripts/subgraph/getSaleHistory.ts` for an alternative approach to querying the Foundation sale history.
 */

import { ethers } from "hardhat";
import { NFTMarket__factory } from "../../typechain-types";
import { ReserveAuctionFinalizedEvent } from "../../typechain-types/NFTMarket";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const addresses = require("@f8n/fnd-protocol/addresses.js");

// The example NFT to query for, this should be updated with the NFT of interest
const collection = "0x3B3ee1931Dc30C1957379FAc9aba94D1C48a5405";
const tokenId = 105912;

async function main(): Promise<void> {
  // Connect to the Foundation market contract
  const market = NFTMarket__factory.connect(addresses.prod[1].nftMarket, ethers.provider);

  // Query for all sales via Buy Price and via Offers
  const buyPricesAccepted = await market.queryFilter(market.filters.BuyPriceAccepted(collection, tokenId));
  const offersAccepted = await market.queryFilter(market.filters.OfferAccepted(collection, tokenId));
  // It is possible to query for all buyPricesAccepted and offersAccepted in a single request, but for simplicity we do it separately here

  const auctionsCreated = await market.queryFilter(market.filters.ReserveAuctionCreated(null, collection, tokenId));
  // Due to use of auctionIds, each auction listing needs to be checked independently to see if it sold (and for how much)
  const auctionsFinalized: ReserveAuctionFinalizedEvent[] = [];
  for (const auction of auctionsCreated) {
    // It is possible that an auction has ended but has not been finalized yet, and therefore be missed with this query
    const finalized = await market.queryFilter(market.filters.ReserveAuctionFinalized(auction.args.auctionId));
    if (finalized.length > 0) {
      // If the auction was finalized, that event will only be emitted once for the given auctionId
      auctionsFinalized.push(finalized[0]);
    }
  }

  let allSales = [...buyPricesAccepted, ...offersAccepted, ...auctionsFinalized];

  if (allSales.length === 0) {
    console.log(`No sales found for ${collection} #${tokenId}`);
    return;
  }

  allSales = allSales.sort((a, b) => {
    // If there were multiple sales in the same block (which should be rare), then sort by log index
    if (a.blockNumber === b.blockNumber) {
      return a.logIndex - b.logIndex;
    }
    // Otherwise sort by block number
    return a.blockNumber - b.blockNumber;
  });

  const mostRecentSale = allSales[allSales.length - 1];

  // The sale price is the sum of the 3 fees emitted
  const mostRecentSalePrice = mostRecentSale.args.sellerRev
    .add(mostRecentSale.args.creatorFee)
    .add(mostRecentSale.args.protocolFee);

  console.log(
    `Most recent sale for ${collection} #${tokenId} was for ${ethers.utils.formatEther(mostRecentSalePrice)} ETH`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
