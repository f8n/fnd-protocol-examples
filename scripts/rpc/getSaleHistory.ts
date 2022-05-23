/*
 * An example of how to query the Foundation sale history of an NFT using RPC (e.g. Alchemy) requests.
 * Run with `yarn run-script scripts/rpc/getSaleHistory.ts --network mainnet`
 */

import { ethers } from "hardhat";
import { FNDNFTMarket__factory } from "../../typechain-types";
import { ReserveAuctionFinalizedEvent } from "../../typechain-types/FNDNFTMarket";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const addresses = require("@f8n/fnd-protocol/addresses.js");

async function main(): Promise<void> {
  const market = FNDNFTMarket__factory.connect(addresses.prod[1].nftMarket, ethers.provider);

  const collection = "0x3B3ee1931Dc30C1957379FAc9aba94D1C48a5405";
  const tokenId = 105912;

  const buyPricesAccepted = await market.queryFilter(market.filters.BuyPriceAccepted(collection, tokenId));
  const offersAccepted = await market.queryFilter(market.filters.OfferAccepted(collection, tokenId));
  // It is possible to query for all buyPricesAccepted and offersAccepted in a single tx, but for simplicity we do it separately here

  // Due to use of auctionIds, each auction listing needs to be checked independently
  const auctionsCreated = await market.queryFilter(market.filters.ReserveAuctionCreated(null, collection, tokenId));
  const auctionsFinalized: ReserveAuctionFinalizedEvent[] = [];
  for (const auction of auctionsCreated) {
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
