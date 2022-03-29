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
  RoyaltyRegistry,
  RoyaltyRegistry__factory,
} from "../../typechain-types";
import addresses from "@f8n/fnd-protocol/addresses.js";
import { ethers } from "ethers";

export type FoundationContracts = {
  treasury: FoundationTreasury;
  market: FNDNFTMarket;
  nft: FNDNFT721;
  percentSplitFactory: PercentSplitETH;
  collectionFactory: FNDCollectionFactory;
  royaltyRegistry: RoyaltyRegistry;
  feth: FETH;
  proxyCall: ExternalProxyCall;
};

export function getFoundationContracts(): FoundationContracts {
  const defaultProvider = ethers.getDefaultProvider();

  const treasury = FoundationTreasury__factory.connect(addresses.prod[1].treasury, defaultProvider);
  const nft = FNDNFT721__factory.connect(addresses.prod[1].nft721, defaultProvider);
  const market = FNDNFTMarket__factory.connect(addresses.prod[1].nftMarket, defaultProvider);
  const percentSplitFactory = PercentSplitETH__factory.connect(addresses.prod[1].percentSplit, defaultProvider);
  const collectionFactory = FNDCollectionFactory__factory.connect(addresses.prod[1].collectionFactory, defaultProvider);
  const royaltyRegistry = RoyaltyRegistry__factory.connect(addresses.prod[1].royaltyRegistry, defaultProvider);
  const feth = FETH__factory.connect(addresses.prod[1].feth, defaultProvider);
  const proxyCall = ExternalProxyCall__factory.connect(addresses.prod[1].proxy, defaultProvider);

  return {
    treasury,
    market,
    nft,
    percentSplitFactory,
    collectionFactory,
    royaltyRegistry,
    feth,
    proxyCall,
  };
}
