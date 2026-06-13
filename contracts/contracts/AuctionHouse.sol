// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AuctionHouse
 * @dev Manages English (ascending bid) and Dutch (descending price) auctions
 *      for ERC-721 NFTs. Implements reentrancy protection, pausable emergency
 *      stop, and the Checks-Effects-Interactions pattern throughout.
 */
contract AuctionHouse is ReentrancyGuard, Ownable, Pausable {
    // ──────────────────────────────────────────────
    // Enums & Structs
    // ──────────────────────────────────────────────

    enum AuctionType { English, Dutch }
    enum AuctionStatus { Active, Finalized, Cancelled }

    struct Auction {
        uint256 auctionId;
        AuctionType auctionType;
        AuctionStatus status;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        uint256 startingPrice;   // English: min bid | Dutch: start price
        uint256 endPrice;        // Dutch only: floor price
        address highestBidder;   // English only
        uint256 highestBid;      // English only
    }

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    mapping(uint256 => Auction) private _auctions;
    uint256 public auctionCount;
    uint256[] private _activeAuctionIds;

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        AuctionType auctionType,
        uint256 startingPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event RefundSent(
        address indexed bidder,
        uint256 amount
    );

    event AuctionFinalized(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount
    );

    event AuctionCancelled(uint256 indexed auctionId);

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ──────────────────────────────────────────────
    // English Auction
    // ──────────────────────────────────────────────

    /**
     * @notice Creates an English (ascending bid) auction for an ERC-721 NFT.
     * @param _nftContract Address of the ERC-721 contract.
     * @param _tokenId     Token ID to auction.
     * @param _startingBid Minimum first bid in wei.
     * @param _duration    Auction duration in seconds.
     */
    function createEnglishAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingBid,
        uint256 _duration
    ) external whenNotPaused {
        require(_nftContract != address(0), "Invalid NFT contract");
        require(_duration > 0, "Duration must be > 0");
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == msg.sender,
            "Caller is not the NFT owner"
        );

        // Transfer NFT to this contract (caller must have approved first)
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        auctionCount++;
        uint256 auctionId = auctionCount;

        _auctions[auctionId] = Auction({
            auctionId: auctionId,
            auctionType: AuctionType.English,
            status: AuctionStatus.Active,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            startingPrice: _startingBid,
            endPrice: 0,
            highestBidder: address(0),
            highestBid: 0
        });

        _activeAuctionIds.push(auctionId);

        emit AuctionCreated(
            auctionId,
            msg.sender,
            _nftContract,
            _tokenId,
            AuctionType.English,
            _startingBid,
            block.timestamp + _duration
        );
    }

    /**
     * @notice Places a bid on an active English auction. The previous highest
     *         bidder is automatically refunded (CEI pattern).
     * @param _auctionId The auction to bid on.
     */
    function placeBid(uint256 _auctionId) external payable nonReentrant whenNotPaused {
        Auction storage auction = _auctions[_auctionId];

        // CHECKS
        require(auction.auctionId != 0, "Auction does not exist");
        require(auction.status == AuctionStatus.Active, "Auction is not active");
        require(auction.auctionType == AuctionType.English, "Not an English auction");
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(msg.sender != auction.seller, "Seller cannot bid");

        if (auction.highestBid == 0) {
            // First bid: must meet or exceed starting price
            require(msg.value >= auction.startingPrice, "Bid below starting price");
        } else {
            // Subsequent bids: must exceed current highest bid
            require(msg.value > auction.highestBid, "Bid not high enough");
        }

        // Store previous bidder info for refund
        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;

        // EFFECTS — update state before external calls
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        // INTERACTIONS — refund previous bidder
        if (previousBidder != address(0)) {
            (bool refundSuccess, ) = payable(previousBidder).call{value: previousBid}("");
            require(refundSuccess, "Refund to previous bidder failed");
            emit RefundSent(previousBidder, previousBid);
        }

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    /**
     * @notice Finalizes a completed English auction: transfers the NFT to the
     *         highest bidder and sends the winning bid to the seller.
     *         If there are no bids the NFT is returned to the seller.
     * @param _auctionId The auction to finalize.
     */
    function finalizeAuction(uint256 _auctionId) external nonReentrant whenNotPaused {
        Auction storage auction = _auctions[_auctionId];

        // CHECKS
        require(auction.auctionId != 0, "Auction does not exist");
        require(auction.status == AuctionStatus.Active, "Auction is not active");
        require(auction.auctionType == AuctionType.English, "Not an English auction");
        require(block.timestamp >= auction.endTime, "Auction has not ended yet");

        // EFFECTS — set status before external calls
        auction.status = AuctionStatus.Finalized;
        _removeActiveAuction(_auctionId);

        // INTERACTIONS
        if (auction.highestBidder != address(0)) {
            // Transfer NFT to winner
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );

            // Transfer funds to seller
            (bool paySuccess, ) = payable(auction.seller).call{value: auction.highestBid}("");
            require(paySuccess, "Payment to seller failed");

            emit AuctionFinalized(_auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids — return NFT to seller
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );

            emit AuctionFinalized(_auctionId, address(0), 0);
        }
    }

    // ──────────────────────────────────────────────
    // Dutch Auction
    // ──────────────────────────────────────────────

    /**
     * @notice Creates a Dutch (descending price) auction for an ERC-721 NFT.
     * @param _nftContract Address of the ERC-721 contract.
     * @param _tokenId     Token ID to auction.
     * @param _startPrice  Initial (highest) price in wei.
     * @param _endPrice    Final (lowest) price in wei.
     * @param _duration    Duration over which the price decreases, in seconds.
     */
    function createDutchAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startPrice,
        uint256 _endPrice,
        uint256 _duration
    ) external whenNotPaused {
        require(_nftContract != address(0), "Invalid NFT contract");
        require(_startPrice > _endPrice, "Start price must exceed end price");
        require(_duration > 0, "Duration must be > 0");
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == msg.sender,
            "Caller is not the NFT owner"
        );

        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        auctionCount++;
        uint256 auctionId = auctionCount;

        _auctions[auctionId] = Auction({
            auctionId: auctionId,
            auctionType: AuctionType.Dutch,
            status: AuctionStatus.Active,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            startingPrice: _startPrice,
            endPrice: _endPrice,
            highestBidder: address(0),
            highestBid: 0
        });

        _activeAuctionIds.push(auctionId);

        emit AuctionCreated(
            auctionId,
            msg.sender,
            _nftContract,
            _tokenId,
            AuctionType.Dutch,
            _startPrice,
            block.timestamp + _duration
        );
    }

    /**
     * @notice Returns the current price of a Dutch auction based on linear decay.
     * @param _auctionId The Dutch auction to query.
     * @return The current price in wei.
     */
    function getCurrentPrice(uint256 _auctionId) public view returns (uint256) {
        Auction storage auction = _auctions[_auctionId];
        require(auction.auctionId != 0, "Auction does not exist");
        require(auction.auctionType == AuctionType.Dutch, "Not a Dutch auction");

        if (block.timestamp >= auction.endTime) {
            return auction.endPrice;
        }

        uint256 elapsed = block.timestamp - auction.startTime;
        uint256 duration = auction.endTime - auction.startTime;
        uint256 priceDrop = ((auction.startingPrice - auction.endPrice) * elapsed) / duration;

        return auction.startingPrice - priceDrop;
    }

    /**
     * @notice Buys the NFT from a Dutch auction at the current descending price.
     *         Any excess ETH is refunded to the buyer.
     * @param _auctionId The Dutch auction to buy from.
     */
    function buyFromDutchAuction(uint256 _auctionId) external payable nonReentrant whenNotPaused {
        Auction storage auction = _auctions[_auctionId];

        // CHECKS
        require(auction.auctionId != 0, "Auction does not exist");
        require(auction.status == AuctionStatus.Active, "Auction is not active");
        require(auction.auctionType == AuctionType.Dutch, "Not a Dutch auction");
        require(block.timestamp <= auction.endTime, "Auction has expired");

        uint256 currentPrice = getCurrentPrice(_auctionId);
        require(msg.value >= currentPrice, "Insufficient payment");

        // EFFECTS
        auction.status = AuctionStatus.Finalized;
        auction.highestBidder = msg.sender;
        auction.highestBid = currentPrice;
        _removeActiveAuction(_auctionId);

        // INTERACTIONS
        // Transfer NFT to buyer
        IERC721(auction.nftContract).transferFrom(
            address(this),
            msg.sender,
            auction.tokenId
        );

        // Pay seller
        (bool paySuccess, ) = payable(auction.seller).call{value: currentPrice}("");
        require(paySuccess, "Payment to seller failed");

        // Refund excess
        uint256 excess = msg.value - currentPrice;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "Refund of excess failed");
        }

        emit AuctionFinalized(_auctionId, msg.sender, currentPrice);
    }

    // ──────────────────────────────────────────────
    // Cancel
    // ──────────────────────────────────────────────

    /**
     * @notice Cancels an active auction. English auctions can only be cancelled
     *         if there are no bids. The NFT is returned to the seller.
     * @param _auctionId The auction to cancel.
     */
    function cancelAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = _auctions[_auctionId];

        require(auction.auctionId != 0, "Auction does not exist");
        require(auction.status == AuctionStatus.Active, "Auction is not active");
        require(msg.sender == auction.seller, "Only seller can cancel");

        if (auction.auctionType == AuctionType.English) {
            require(auction.highestBidder == address(0), "Cannot cancel auction with bids");
        }

        // EFFECTS
        auction.status = AuctionStatus.Cancelled;
        _removeActiveAuction(_auctionId);

        // INTERACTIONS — return NFT
        IERC721(auction.nftContract).transferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        emit AuctionCancelled(_auctionId);
    }

    // ──────────────────────────────────────────────
    // View Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Returns the full details of an auction.
     */
    function getAuction(uint256 _auctionId) external view returns (Auction memory) {
        require(_auctions[_auctionId].auctionId != 0, "Auction does not exist");
        return _auctions[_auctionId];
    }

    /**
     * @notice Returns an array of all currently active auction IDs.
     */
    function getActiveAuctions() external view returns (uint256[] memory) {
        return _activeAuctionIds;
    }

    // ──────────────────────────────────────────────
    // Pausable (Emergency Stop)
    // ──────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ──────────────────────────────────────────────
    // Internal Helpers
    // ──────────────────────────────────────────────

    /**
     * @dev Removes an auction ID from the active array using swap-and-pop.
     */
    function _removeActiveAuction(uint256 _auctionId) internal {
        uint256 length = _activeAuctionIds.length;
        for (uint256 i = 0; i < length; i++) {
            if (_activeAuctionIds[i] == _auctionId) {
                _activeAuctionIds[i] = _activeAuctionIds[length - 1];
                _activeAuctionIds.pop();
                return;
            }
        }
    }
}
