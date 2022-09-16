import {
  FETH,
  FETH__factory,
  FoundationTreasury,
  FoundationTreasury__factory,
  NFTCollectionFactory,
  NFTCollectionFactory__factory,
  NFTMarket,
  NFTMarket__factory,
  PercentSplitETH,
  PercentSplitETH__factory,
} from "../../typechain-types/index";
import { ethers } from "hardhat";
import { resetNodeState } from "./mainnet";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const addresses = require("@f8n/fnd-protocol/addresses.js");

export type FoundationContracts = {
  treasury: FoundationTreasury;
  market: NFTMarket;
  percentSplitFactory: PercentSplitETH;
  collectionFactory: NFTCollectionFactory;
  feth: FETH;
};

export async function getFoundationContracts(): Promise<FoundationContracts> {
  await resetNodeState();
  const [defaultAccount] = await ethers.getSigners();

  const treasury = FoundationTreasury__factory.connect(addresses.prod[1].treasury, defaultAccount);
  const market = NFTMarket__factory.connect(addresses.prod[1].nftMarket, defaultAccount);
  const percentSplitFactory = PercentSplitETH__factory.connect(addresses.prod[1].percentSplit, defaultAccount);
  const collectionFactory = NFTCollectionFactory__factory.connect(
    addresses.prod[1].nftCollectionFactoryV2,
    defaultAccount,
  );
  const feth = FETH__factory.connect(addresses.prod[1].feth, defaultAccount);

  return {
    treasury,
    market,
    percentSplitFactory,
    collectionFactory,
    feth,
  };
}
