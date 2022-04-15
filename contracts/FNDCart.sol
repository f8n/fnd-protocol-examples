// SPDX-License-Identifier: MIT OR Apache-2.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@f8n/fnd-protocol/contracts/FNDNFTMarket.sol";
import "@f8n/fnd-protocol/contracts/FETH.sol";

/**
 * @title A contract to buy, bid on, or make an offer for multiple NFTs with a single transaction.
 * @dev This contract has not been fully tested or audited.
 */
contract FNDCart is Ownable {
  using Address for address payable;
  using Math for uint256;

  FNDNFTMarket public immutable market;
  FETH public immutable feth;
  address payable public immutable referrerTreasury;

  struct NFT {
    address nftContract;
    uint256 tokenId;
  }

  struct CartItem {
    NFT nft;
    uint256 maxPrice;
  }

  /**
   * @notice Initialize the contract.
   * @param _market The Foundation market contract address on this network.
   * @param _referrerTreasury A treasury address to receive a referral kick-back fee.
   */
  constructor(
    address payable _market,
    address payable _feth,
    address payable _referrerTreasury
  ) {
    market = FNDNFTMarket(_market);
    feth = FETH(_feth);
    referrerTreasury = _referrerTreasury;
  }

  /**
   * @notice Accept native currency payments (e.g. bid refunds from the market) and forward them to the owner.
   */
  receive() external payable {
    payable(owner()).sendValue(address(this).balance);
  }

  /**
   * @notice Buy instantly or place the minimum bid on each of the tokens provided,
   * if the price is less than the max specified; otherwise make an offer if possible.
   * Any funds remaining will be instantly refunded.
   */
  function checkout(CartItem[] calldata cart) external payable onlyOwner {
    // Transfer any FETH available to consider in the available funds calculations.
    uint256 balance = feth.balanceOf(address(this));
    if (balance != 0) {
      feth.withdrawAvailableBalance();
    }

    // Attempt to purchase each item in the cart.
    for (uint256 i = 0; i < cart.length; ++i) {
      CartItem memory item = cart[i];

      // 1) Buy instantly
      if (!_tryBuy(item)) {
        // 2) Place a bid
        if (!_tryBid(item)) {
          // 3) Make an offer
          _tryOffer(item);
        }
      }
    }

    // Refund any ETH remaining.
    if (address(this).balance != 0) {
      payable(msg.sender).sendValue(address(this).balance);
    }
  }

  /**
   * @notice Withdraw any FETH & ETH currently held by this contract.
   * @dev This may apply if one of your bids was later outbid.
   */
  function withdrawBalance() external onlyOwner {
    // Transfer FETH if there's any available.
    uint256 balance = feth.balanceOf(address(this));
    if (balance != 0) {
      feth.withdrawFrom(address(this), payable(msg.sender), balance);
    }

    // Withdraw ETH.
    if (address(this).balance != 0) {
      payable(msg.sender).sendValue(address(this).balance);
    }
  }

  /**
   * @notice Withdraw an NFT from this contract.
   * This will settle the auction won by this contract first, if required.
   */
  function withdrawNFTs(NFT[] calldata nfts) external onlyOwner {
    for (uint256 i = 0; i < nfts.length; ++i) {
      NFT memory nft = nfts[i];
      _trySettleAuction(nft);
      _tryTransferNFT(nft);
    }
  }

  /**
   * @notice Make any arbitrary calls.
   * @dev This should not be necessary, but here just in case you need to recover other assets.
   */
  function proxyCall(
    address payable target,
    bytes memory callData,
    uint256 value
  ) external onlyOwner {
    target.functionCallWithValue(callData, value);
  }

  /**
   * @notice Place the minimum bid possible if there's an auction available <= the max price for this item.
   */
  function _tryBid(CartItem memory item) internal returns (bool bidPlaced) {
    uint256 auctionId = market.getReserveAuctionIdFor(item.nft.nftContract, item.nft.tokenId);
    if (auctionId != 0) {
      uint256 bid = market.getMinBidAmount(auctionId);
      if (bid <= item.maxPrice && bid <= address(this).balance) {
        try
          market.placeBidOf{ value: bid }(auctionId, bid) // solhint-disable-next-line no-empty-blocks
        {
          // Successfully placed the bid.
          bidPlaced = true;
        } catch // solhint-disable-next-line no-empty-blocks
        {
          // The bid may fail if the auction has ended of if this contract is already the highest bidder.
        }
      }
    }
  }

  /**
   * @notice Buy if the NFT has a buy price set <= the max price for this item.
   */
  function _tryBuy(CartItem memory item) internal returns (bool bought) {
    (, uint256 price) = market.getBuyPrice(item.nft.nftContract, item.nft.tokenId);
    // The price would be MAX_UINT256 if the token is not for sale with buy now.
    if (price <= item.maxPrice && price <= address(this).balance) {
      // Buy NFT with a referral kick-back to the cart's treasury.
      market.buyV2{ value: price }(item.nft.nftContract, item.nft.tokenId, price, referrerTreasury);
      // Transfer the NFT to the end user.
      IERC721(item.nft.nftContract).transferFrom(address(this), msg.sender, item.nft.tokenId);
      bought = true;
    }
  }

  /**
   * @notice Attempt to offer the max price specified for this item.
   */
  function _tryOffer(CartItem memory item) internal returns (bool offerMade) {
    uint256 offer = item.maxPrice.min(address(this).balance);
    try
      market.makeOffer(item.nft.nftContract, item.nft.tokenId, offer) // solhint-disable-next-line no-empty-blocks
    {
      // Successfully made the offer.
      offerMade = true;
    } catch // solhint-disable-next-line no-empty-blocks
    {
      // The offer may fail if there's an auction in progress or another user already outbid us.
    }
  }

  function _trySettleAuction(NFT memory nft) internal {
    // Check if the NFT is pending an auction settle first
    uint256 auctionId = market.getReserveAuctionIdFor(nft.nftContract, nft.tokenId);
    if (auctionId != 0) {
      try
        market.finalizeReserveAuction(auctionId) // solhint-disable-next-line no-empty-blocks
      {
        // Successfully settled the auction.
      } catch // solhint-disable-next-line no-empty-blocks
      {
        // If the auction is not over, this call will revert and then NFT is not ready to withdraw.
      }
    }
  }

  function _tryTransferNFT(NFT memory nft) internal {
    try
      IERC721(nft.nftContract).transferFrom(address(this), msg.sender, nft.tokenId)
    // solhint-disable-next-line no-empty-blocks
    {

    } catch // solhint-disable-next-line no-empty-blocks
    {

    }
  }
}
