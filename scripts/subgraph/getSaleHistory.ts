/*
 * An example of how to query the Foundation sale history from our hosted subgraph.
 * Run with `yarn run-script scripts/subgraph/getSaleHistory.ts`
 *
 * See `scripts/rpc/getSaleHistory.ts` for an alternative approach to querying the Foundation sale history.
 */

import gql from "graphql-tag";
import { GraphQLClient } from "graphql-request";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const subgraphEndpoints = require("@f8n/fnd-protocol/subgraphEndpoints.js");

// The example NFT to query for, this should be updated with the NFT of interest
const collection = "0x3B3ee1931Dc30C1957379FAc9aba94D1C48a5405";
const tokenId = 105912;

async function main(): Promise<void> {
  // Connect to the Foundation subgraph endpoint
  const graphClient = new GraphQLClient(subgraphEndpoints.prod[1]);

  // Subgraph queries are case sensitive and addresses are always lowercase (instead of in the checksum format)
  const saleHistoryQuery = gql`{
        nftHistories(
            where: {
                nft: "${collection.toLowerCase()}-${tokenId}"
                event_in: [Sold, OfferAccepted, BuyPriceAccepted]
            },
            orderBy: date,
            orderDirection: asc
        ) {
            event
            amountInETH
        }
    }`;

  // Query for the sales history
  const saleHistory = await graphClient.request(saleHistoryQuery);

  if (saleHistory.nftHistories.length === 0) {
    console.log(`No sales found for ${collection} #${tokenId}`);
    return;
  }

  const mostRecentSale = saleHistory.nftHistories[saleHistory.nftHistories.length - 1];

  console.log(`Most recent sale for ${collection} #${tokenId} was for ${mostRecentSale.amountInETH} ETH`);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
