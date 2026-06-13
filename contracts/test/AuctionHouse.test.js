const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("AuctionHouse", function () {
  const ONE_ETH = ethers.parseEther("1.0");
  const TWO_ETH = ethers.parseEther("2.0");
  const HALF_ETH = ethers.parseEther("0.5");
  const POINT_TWO_ETH = ethers.parseEther("0.2");
  const ONE_DAY = 86400; // seconds

  // ──────────────────────────────────────────────
  // Fixtures
  // ──────────────────────────────────────────────

  async function deployFixture() {
    const [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const RWAToken = await ethers.getContractFactory("RWAToken");
    const token = await RWAToken.deploy();
    await token.waitForDeployment();

    const AuctionHouse = await ethers.getContractFactory("AuctionHouse");
    const auction = await AuctionHouse.deploy();
    await auction.waitForDeployment();

    return { token, auction, owner, seller, bidder1, bidder2, bidder3 };
  }

  async function mintAndApproveFixture() {
    const base = await deployFixture();
    const { token, auction, owner, seller } = base;
    const auctionAddr = await auction.getAddress();

    // Mint token #1 to seller
    await token.mint(seller.address, "https://example.com/meta/1");
    // Seller approves AuctionHouse
    await token.connect(seller).approve(auctionAddr, 1);

    return { ...base, tokenId: 1 };
  }

  async function englishAuctionFixture() {
    const base = await mintAndApproveFixture();
    const { auction, seller, token } = base;
    const tokenAddr = await token.getAddress();

    // Create English auction: starting bid 1 ETH, duration 1 day
    await auction
      .connect(seller)
      .createEnglishAuction(tokenAddr, 1, ONE_ETH, ONE_DAY);

    return { ...base, auctionId: 1 };
  }

  async function dutchAuctionFixture() {
    const base = await mintAndApproveFixture();
    const { auction, seller, token } = base;
    const tokenAddr = await token.getAddress();

    // Create Dutch auction: start 2 ETH, end 0.5 ETH, duration 1 day
    await auction
      .connect(seller)
      .createDutchAuction(tokenAddr, 1, TWO_ETH, HALF_ETH, ONE_DAY);

    return { ...base, auctionId: 1 };
  }

  // ──────────────────────────────────────────────
  // English Auction — Creation
  // ──────────────────────────────────────────────

  describe("English Auction — Creation", function () {
    it("Should create an English auction and transfer NFT to contract", async function () {
      const { token, auction, seller } = await loadFixture(mintAndApproveFixture);
      const tokenAddr = await token.getAddress();
      const auctionAddr = await auction.getAddress();

      await auction
        .connect(seller)
        .createEnglishAuction(tokenAddr, 1, ONE_ETH, ONE_DAY);

      expect(await token.ownerOf(1)).to.equal(auctionAddr);
    });

    it("Should emit AuctionCreated event with correct params", async function () {
      const { token, auction, seller } = await loadFixture(mintAndApproveFixture);
      const tokenAddr = await token.getAddress();

      await expect(
        auction.connect(seller).createEnglishAuction(tokenAddr, 1, ONE_ETH, ONE_DAY)
      )
        .to.emit(auction, "AuctionCreated")
        .withArgs(
          1,
          seller.address,
          tokenAddr,
          1,
          0, // AuctionType.English
          ONE_ETH,
          (await time.latest()) + ONE_DAY + 1
        );
    });

    it("Should store correct auction data", async function () {
      const { auction } = await loadFixture(englishAuctionFixture);
      const a = await auction.getAuction(1);

      expect(a.auctionId).to.equal(1);
      expect(a.auctionType).to.equal(0); // English
      expect(a.status).to.equal(0); // Active
      expect(a.startingPrice).to.equal(ONE_ETH);
      expect(a.highestBidder).to.equal(ethers.ZeroAddress);
      expect(a.highestBid).to.equal(0);
    });

    it("Should add auction to active list", async function () {
      const { auction } = await loadFixture(englishAuctionFixture);
      const active = await auction.getActiveAuctions();
      expect(active.length).to.equal(1);
      expect(active[0]).to.equal(1);
    });

    it("Should revert if caller is not NFT owner", async function () {
      const { token, auction, bidder1 } = await loadFixture(mintAndApproveFixture);
      const tokenAddr = await token.getAddress();

      await expect(
        auction.connect(bidder1).createEnglishAuction(tokenAddr, 1, ONE_ETH, ONE_DAY)
      ).to.be.revertedWith("Caller is not the NFT owner");
    });

    it("Should revert if duration is 0", async function () {
      const { token, auction, seller } = await loadFixture(mintAndApproveFixture);
      const tokenAddr = await token.getAddress();

      await expect(
        auction.connect(seller).createEnglishAuction(tokenAddr, 1, ONE_ETH, 0)
      ).to.be.revertedWith("Duration must be > 0");
    });

    it("Should increment auctionCount", async function () {
      const { auction } = await loadFixture(englishAuctionFixture);
      expect(await auction.auctionCount()).to.equal(1);
    });
  });

  // ──────────────────────────────────────────────
  // English Auction — Bidding
  // ──────────────────────────────────────────────

  describe("English Auction — Bidding", function () {
    it("Should accept a valid first bid", async function () {
      const { auction, bidder1 } = await loadFixture(englishAuctionFixture);

      await expect(
        auction.connect(bidder1).placeBid(1, { value: ONE_ETH })
      )
        .to.emit(auction, "BidPlaced")
        .withArgs(1, bidder1.address, ONE_ETH);

      const a = await auction.getAuction(1);
      expect(a.highestBidder).to.equal(bidder1.address);
      expect(a.highestBid).to.equal(ONE_ETH);
    });

    it("Should accept a higher bid and refund previous bidder", async function () {
      const { auction, bidder1, bidder2 } = await loadFixture(englishAuctionFixture);

      // Bidder1 bids 1 ETH
      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });

      const bidder1BalBefore = await ethers.provider.getBalance(bidder1.address);

      // Bidder2 bids 2 ETH → bidder1 should get refund
      await expect(
        auction.connect(bidder2).placeBid(1, { value: TWO_ETH })
      )
        .to.emit(auction, "RefundSent")
        .withArgs(bidder1.address, ONE_ETH);

      const bidder1BalAfter = await ethers.provider.getBalance(bidder1.address);
      expect(bidder1BalAfter - bidder1BalBefore).to.equal(ONE_ETH);

      const a = await auction.getAuction(1);
      expect(a.highestBidder).to.equal(bidder2.address);
      expect(a.highestBid).to.equal(TWO_ETH);
    });

    it("Should revert if bid is below starting price", async function () {
      const { auction, bidder1 } = await loadFixture(englishAuctionFixture);

      await expect(
        auction.connect(bidder1).placeBid(1, { value: HALF_ETH })
      ).to.be.revertedWith("Bid below starting price");
    });

    it("Should revert if bid is not higher than current highest", async function () {
      const { auction, bidder1, bidder2 } = await loadFixture(englishAuctionFixture);

      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });

      await expect(
        auction.connect(bidder2).placeBid(1, { value: ONE_ETH })
      ).to.be.revertedWith("Bid not high enough");
    });

    it("Should revert if auction has ended", async function () {
      const { auction, bidder1 } = await loadFixture(englishAuctionFixture);

      await time.increase(ONE_DAY + 1);

      await expect(
        auction.connect(bidder1).placeBid(1, { value: ONE_ETH })
      ).to.be.revertedWith("Auction has ended");
    });

    it("Should revert if seller tries to bid", async function () {
      const { auction, seller } = await loadFixture(englishAuctionFixture);

      await expect(
        auction.connect(seller).placeBid(1, { value: ONE_ETH })
      ).to.be.revertedWith("Seller cannot bid");
    });

    it("Should revert for non-existent auction", async function () {
      const { auction, bidder1 } = await loadFixture(englishAuctionFixture);

      await expect(
        auction.connect(bidder1).placeBid(999, { value: ONE_ETH })
      ).to.be.revertedWith("Auction does not exist");
    });
  });

  // ──────────────────────────────────────────────
  // English Auction — Finalization
  // ──────────────────────────────────────────────

  describe("English Auction — Finalization", function () {
    it("Should finalize and transfer NFT to winner, funds to seller", async function () {
      const { token, auction, seller, bidder1 } = await loadFixture(englishAuctionFixture);

      await auction.connect(bidder1).placeBid(1, { value: TWO_ETH });

      await time.increase(ONE_DAY + 1);

      const sellerBalBefore = await ethers.provider.getBalance(seller.address);

      await expect(auction.finalizeAuction(1))
        .to.emit(auction, "AuctionFinalized")
        .withArgs(1, bidder1.address, TWO_ETH);

      // NFT goes to winner
      expect(await token.ownerOf(1)).to.equal(bidder1.address);

      // Seller receives payment
      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalAfter - sellerBalBefore).to.equal(TWO_ETH);
    });

    it("Should return NFT to seller if no bids", async function () {
      const { token, auction, seller } = await loadFixture(englishAuctionFixture);

      await time.increase(ONE_DAY + 1);

      await auction.finalizeAuction(1);

      expect(await token.ownerOf(1)).to.equal(seller.address);
    });

    it("Should remove auction from active list after finalization", async function () {
      const { auction } = await loadFixture(englishAuctionFixture);

      await time.increase(ONE_DAY + 1);
      await auction.finalizeAuction(1);

      const active = await auction.getActiveAuctions();
      expect(active.length).to.equal(0);
    });

    it("Should revert if auction has not ended", async function () {
      const { auction } = await loadFixture(englishAuctionFixture);

      await expect(auction.finalizeAuction(1)).to.be.revertedWith(
        "Auction has not ended yet"
      );
    });

    it("Should revert if auction is already finalized", async function () {
      const { auction } = await loadFixture(englishAuctionFixture);

      await time.increase(ONE_DAY + 1);
      await auction.finalizeAuction(1);

      await expect(auction.finalizeAuction(1)).to.be.revertedWith(
        "Auction is not active"
      );
    });
  });

  // ──────────────────────────────────────────────
  // Dutch Auction — Creation
  // ──────────────────────────────────────────────

  describe("Dutch Auction — Creation", function () {
    it("Should create a Dutch auction and transfer NFT", async function () {
      const { token, auction } = await loadFixture(dutchAuctionFixture);
      const auctionAddr = await auction.getAddress();

      expect(await token.ownerOf(1)).to.equal(auctionAddr);

      const a = await auction.getAuction(1);
      expect(a.auctionType).to.equal(1); // Dutch
      expect(a.startingPrice).to.equal(TWO_ETH);
      expect(a.endPrice).to.equal(HALF_ETH);
    });

    it("Should revert if start price <= end price", async function () {
      const { token, auction, seller } = await loadFixture(mintAndApproveFixture);
      const tokenAddr = await token.getAddress();

      await expect(
        auction
          .connect(seller)
          .createDutchAuction(tokenAddr, 1, ONE_ETH, TWO_ETH, ONE_DAY)
      ).to.be.revertedWith("Start price must exceed end price");
    });
  });

  // ──────────────────────────────────────────────
  // Dutch Auction — Price & Purchase
  // ──────────────────────────────────────────────

  describe("Dutch Auction — Price & Purchase", function () {
    it("Should return starting price at the beginning", async function () {
      const { auction } = await loadFixture(dutchAuctionFixture);
      const price = await auction.getCurrentPrice(1);
      // Price should be at or very near startingPrice
      expect(price).to.be.closeTo(TWO_ETH, ethers.parseEther("0.01"));
    });

    it("Should decrease price over time", async function () {
      const { auction } = await loadFixture(dutchAuctionFixture);

      // Move forward half the duration
      await time.increase(ONE_DAY / 2);

      const price = await auction.getCurrentPrice(1);
      // Mid-point: 2 - (2-0.5)*0.5 = 2 - 0.75 = 1.25 ETH
      const expectedMid = ethers.parseEther("1.25");
      expect(price).to.be.closeTo(expectedMid, ethers.parseEther("0.02"));
    });

    it("Should return end price after duration", async function () {
      const { auction } = await loadFixture(dutchAuctionFixture);

      await time.increase(ONE_DAY + 1);

      const price = await auction.getCurrentPrice(1);
      expect(price).to.equal(HALF_ETH);
    });

    it("Should allow buying at current price", async function () {
      const { token, auction, seller, bidder1 } = await loadFixture(dutchAuctionFixture);

      // Move forward a bit so price drops
      await time.increase(ONE_DAY / 4);

      const currentPrice = await auction.getCurrentPrice(1);
      const sellerBalBefore = await ethers.provider.getBalance(seller.address);

      // Send enough to cover any slight price change between read and execution
      const tx = await auction.connect(bidder1).buyFromDutchAuction(1, { value: currentPrice + ethers.parseEther("0.01") });
      await tx.wait();

      // Verify the event was emitted
      await expect(tx).to.emit(auction, "AuctionFinalized");

      // NFT transferred to buyer
      expect(await token.ownerOf(1)).to.equal(bidder1.address);

      // Seller received payment (should be close to currentPrice)
      const sellerBalAfter = await ethers.provider.getBalance(seller.address);
      const received = sellerBalAfter - sellerBalBefore;
      expect(received).to.be.closeTo(currentPrice, ethers.parseEther("0.01"));
    });

    it("Should refund excess ETH sent", async function () {
      const { auction, bidder1 } = await loadFixture(dutchAuctionFixture);

      await time.increase(ONE_DAY / 2);
      const currentPrice = await auction.getCurrentPrice(1);
      const overpayment = currentPrice + ethers.parseEther("1.0");

      const bidderBalBefore = await ethers.provider.getBalance(bidder1.address);

      const tx = await auction
        .connect(bidder1)
        .buyFromDutchAuction(1, { value: overpayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const bidderBalAfter = await ethers.provider.getBalance(bidder1.address);
      // Bidder should only have paid currentPrice + gas
      const spent = bidderBalBefore - bidderBalAfter;
      expect(spent).to.be.closeTo(currentPrice + gasUsed, ethers.parseEther("0.001"));
    });

    it("Should revert if payment is insufficient", async function () {
      const { auction, bidder1 } = await loadFixture(dutchAuctionFixture);

      await expect(
        auction.connect(bidder1).buyFromDutchAuction(1, { value: POINT_TWO_ETH })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if auction has expired", async function () {
      const { auction, bidder1 } = await loadFixture(dutchAuctionFixture);

      await time.increase(ONE_DAY + 1);

      await expect(
        auction.connect(bidder1).buyFromDutchAuction(1, { value: HALF_ETH })
      ).to.be.revertedWith("Auction has expired");
    });

    it("Should revert if auction is already finalized", async function () {
      const { auction, bidder1, bidder2 } = await loadFixture(dutchAuctionFixture);

      await auction.connect(bidder1).buyFromDutchAuction(1, { value: TWO_ETH });

      await expect(
        auction.connect(bidder2).buyFromDutchAuction(1, { value: TWO_ETH })
      ).to.be.revertedWith("Auction is not active");
    });
  });

  // ──────────────────────────────────────────────
  // Cancel Auction
  // ──────────────────────────────────────────────

  describe("Cancel Auction", function () {
    it("Should allow seller to cancel auction with no bids", async function () {
      const { token, auction, seller } = await loadFixture(englishAuctionFixture);

      await expect(auction.connect(seller).cancelAuction(1))
        .to.emit(auction, "AuctionCancelled")
        .withArgs(1);

      // NFT returned to seller
      expect(await token.ownerOf(1)).to.equal(seller.address);

      // Status is Cancelled
      const a = await auction.getAuction(1);
      expect(a.status).to.equal(2); // Cancelled

      // Removed from active list
      const active = await auction.getActiveAuctions();
      expect(active.length).to.equal(0);
    });

    it("Should revert if non-seller tries to cancel", async function () {
      const { auction, bidder1 } = await loadFixture(englishAuctionFixture);

      await expect(
        auction.connect(bidder1).cancelAuction(1)
      ).to.be.revertedWith("Only seller can cancel");
    });

    it("Should revert if English auction has bids", async function () {
      const { auction, seller, bidder1 } = await loadFixture(englishAuctionFixture);

      await auction.connect(bidder1).placeBid(1, { value: ONE_ETH });

      await expect(
        auction.connect(seller).cancelAuction(1)
      ).to.be.revertedWith("Cannot cancel auction with bids");
    });

    it("Should allow seller to cancel Dutch auction", async function () {
      const { token, auction, seller } = await loadFixture(dutchAuctionFixture);

      await auction.connect(seller).cancelAuction(1);
      expect(await token.ownerOf(1)).to.equal(seller.address);
    });
  });

  // ──────────────────────────────────────────────
  // Pausable
  // ──────────────────────────────────────────────

  describe("Pausable", function () {
    it("Should allow owner to pause and unpause", async function () {
      const { auction, owner } = await loadFixture(deployFixture);

      await auction.connect(owner).pause();
      // Trying to create auction while paused should revert
      await expect(
        auction.createEnglishAuction(ethers.ZeroAddress, 1, ONE_ETH, ONE_DAY)
      ).to.be.revertedWithCustomError(auction, "EnforcedPause");

      await auction.connect(owner).unpause();
      // Should not revert anymore (will revert for other reason like invalid contract)
    });

    it("Should revert if non-owner tries to pause", async function () {
      const { auction, bidder1 } = await loadFixture(deployFixture);

      await expect(
        auction.connect(bidder1).pause()
      ).to.be.revertedWithCustomError(auction, "OwnableUnauthorizedAccount");
    });

    it("Should prevent bidding when paused", async function () {
      const { auction, owner, bidder1 } = await loadFixture(englishAuctionFixture);

      await auction.connect(owner).pause();

      await expect(
        auction.connect(bidder1).placeBid(1, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(auction, "EnforcedPause");
    });
  });

  // ──────────────────────────────────────────────
  // View Functions
  // ──────────────────────────────────────────────

  describe("View Functions", function () {
    it("Should return auction details via getAuction", async function () {
      const { auction, seller } = await loadFixture(englishAuctionFixture);
      const a = await auction.getAuction(1);
      expect(a.seller).to.equal(seller.address);
    });

    it("Should revert getAuction for non-existent auction", async function () {
      const { auction } = await loadFixture(deployFixture);
      await expect(auction.getAuction(999)).to.be.revertedWith(
        "Auction does not exist"
      );
    });

    it("Should track multiple active auctions", async function () {
      const { token, auction, owner } = await loadFixture(deployFixture);
      const tokenAddr = await token.getAddress();
      const auctionAddr = await auction.getAddress();

      // Mint 3 tokens and create 3 auctions
      for (let i = 1; i <= 3; i++) {
        await token.mint(owner.address, `uri${i}`);
        await token.approve(auctionAddr, i);
        await auction.createEnglishAuction(tokenAddr, i, ONE_ETH, ONE_DAY);
      }

      const active = await auction.getActiveAuctions();
      expect(active.length).to.equal(3);
    });
  });
});
