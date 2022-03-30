import {
  ExternalProxyCall,
  ExternalProxyCall__factory,
  FETH,
  FETH__factory,
  FNDCollectionFactory,
  FNDCollectionFactory__factory,
  FNDNFT721,
  FNDNFT721__factory,
  FNDNFTMarket,
  FNDNFTMarket__factory,
  FoundationTreasury,
  FoundationTreasury__factory,
  PercentSplitETH,
  PercentSplitETH__factory,
} from "../../typechain-types";
import { ethers } from "hardhat";
import { resetNodeState } from "./mainnet";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const addresses = require("@f8n/fnd-protocol/addresses.js");

export type FoundationContracts = {
  treasury: FoundationTreasury;
  market: FNDNFTMarket;
  nft: FNDNFT721;
  percentSplitFactory: PercentSplitETH;
  collectionFactory: FNDCollectionFactory;
  feth: FETH;
  proxyCall: ExternalProxyCall;
};

export async function getFoundationContracts(): Promise<FoundationContracts> {
  await resetNodeState();
  const [defaultAccount] = await ethers.getSigners();

  const treasury = FoundationTreasury__factory.connect(addresses.prod[1].treasury, defaultAccount);
  const nft = FNDNFT721__factory.connect(addresses.prod[1].nft721, defaultAccount);
  const market = FNDNFTMarket__factory.connect(addresses.prod[1].nftMarket, defaultAccount);
  const percentSplitFactory = PercentSplitETH__factory.connect(addresses.prod[1].percentSplit, defaultAccount);
  const collectionFactory = FNDCollectionFactory__factory.connect(addresses.prod[1].collectionFactory, defaultAccount);
  const feth = FETH__factory.connect(addresses.prod[1].feth, defaultAccount);
  const proxyCall = ExternalProxyCall__factory.connect(addresses.prod[1].proxy, defaultAccount);

  return {
    treasury,
    market,
    nft,
    percentSplitFactory,
    collectionFactory,
    feth,
    proxyCall,
  };
}
