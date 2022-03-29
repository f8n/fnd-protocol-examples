import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { ContractTransaction } from "ethers";
import { FETH, FNDCart, FNDCart__factory, FNDNFT721, FNDNFTMarket } from "../typechain-types";
import { getFoundationContracts } from "./helpers/getFoundationContracts";
import { increaseTime } from "../test/helpers/network";
import { ONE_DAY } from "../test/helpers/constants";
import { testIpfsPath } from "../test/helpers/testIpfsPath";

describe("FNDCart", function () {
  let creator: SignerWithAddress;
  let bidder: SignerWithAddress;
  let market: FNDNFTMarket;
  let feth: FETH;
  let nft: FNDNFT721;
  let fndCart: FNDCart;
  const reservePrice = ethers.utils.parseEther("0.1");
  const listedTokenIds = [1, 5, 6, 7];
  const buyPrice = ethers.utils.parseEther("0.42");
  const pricedTokenIds = [3, 5, 9];
  let tx: ContractTransaction;

  beforeEach(async () => {
    [, creator, bidder] = await ethers.getSigners();
    ({ market, feth, nft } = getFoundationContracts());
    fndCart = await new FNDCart__factory(bidder).deploy(market.address, feth.address);

    // Mint 10 tokens
    for (let i = 0; i < 10; i++) {
      const tx = await nft.connect(creator).mint(testIpfsPath[i]);

      if (i === 0) {
        // Update the tokenIds for listings
        const receipt = await tx.wait();
        const log = receipt.events?.find(e => e.event === "Minted");
        if (!log?.args) {
          throw new Error("No `Minted` event detected");
        }
        const baseTokenId = Number.parseInt(log.args[1]);
        for (let j = 0; j < listedTokenIds.length; j++) {
          listedTokenIds[j] += baseTokenId;
        }
        for (let j = 0; j < pricedTokenIds.length; j++) {
          pricedTokenIds[j] += baseTokenId;
        }
      }
    }
    await nft.connect(creator).setApprovalForAll(market.address, true);

    // List a few
    for (const tokenId of listedTokenIds) {
      await market.connect(creator).createReserveAuction(nft.address, tokenId, reservePrice);
    }

    // Set some buy prices
    for (const tokenId of pricedTokenIds) {
      await market.connect(creator).setBuyPrice(nft.address, tokenId, buyPrice);
    }
  });

  describe("Try to buy the entire collection", () => {
    const cart: FNDCart.CartItemStruct[] = [];

    beforeEach(async () => {
      for (const tokenId of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        cart.push({ nft: { nftContract: nft.address, tokenId }, maxPrice: buyPrice });
      }

      tx = await fndCart.checkout(cart, { value: ethers.utils.parseEther("5") });
    });

    it("Emits buy for all purchased NFTs", async () => {
      for (const tokenId of pricedTokenIds) {
        await expect(tx)
          .to.emit(market, "BuyPriceAccepted")
          .withArgs(
            nft.address,
            tokenId,
            creator.address,
            fndCart.address,
            buyPrice.mul(5).div(100),
            buyPrice.mul(95).div(100),
            0,
          );
      }
    });

    it("Bought NFTs were transferred to the bidder", async () => {
      for (const tokenId of pricedTokenIds) {
        const ownerOf = await nft.ownerOf(tokenId);
        expect(ownerOf).to.eq(bidder.address);
      }
    });

    it("Emits bid for all bids placed", async () => {
      for (const tokenId of listedTokenIds) {
        if (pricedTokenIds.includes(tokenId)) {
          // This was purchased directly instead
          continue;
        }
        const auctionId = await market.getReserveAuctionIdFor(nft.address, tokenId);
        const auctionInfo = await market.getReserveAuction(auctionId);
        await expect(tx)
          .to.emit(market, "ReserveAuctionBidPlaced")
          .withArgs(auctionId, fndCart.address, reservePrice, auctionInfo.endTime);
      }
    });

    describe("Withdraw the auction ends", () => {
      beforeEach(async () => {
        await increaseTime(ONE_DAY + 1);

        const nfts: FNDCart.NFTStruct[] = [];
        for (const tokenId of listedTokenIds) {
          nfts.push({ nftContract: nft.address, tokenId });
        }
        tx = await fndCart.withdrawNFTs(nfts, { gasLimit: 1_000_000 });
      });

      it("Winning bids were settled and transferred to the bidder", async () => {
        for (const tokenId of listedTokenIds) {
          if (pricedTokenIds.includes(tokenId)) {
            // This was purchased directly instead
            continue;
          }
          const ownerOf = await nft.ownerOf(tokenId);
          expect(ownerOf).to.eq(bidder.address);
        }
      });
    });
  });
});
