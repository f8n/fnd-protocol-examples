/*
 * An example of how to query the time an NFT was minted from our hosted subgraph.
 * Run with `yarn run-script scripts/subgraph/getMintedAt.ts`
 *
 * Note: due to a limit in our subgraph implementation ATM this only works for Foundation NFTs
 * (a Foundation created collection or the shared collection contract).
 *
 * See `scripts/rpc/getMintedAt.ts` for an alternative approach to querying this value.
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
  const mintedAtQuery = gql`{
        nft(id: "${collection.toLowerCase()}-${tokenId}")
        {
            dateMinted
        }
    }`;

  // Query for the date minted
  const results = await graphClient.request(mintedAtQuery);
  console.log(results);

  if (!results?.nft?.dateMinted) {
    console.log(`NFT not found: ${collection} #${tokenId}`);
    return;
  }

  console.log(`NFT ${collection} #${tokenId} was minted at ${results.nft.dateMinted}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
