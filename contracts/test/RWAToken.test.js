const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("RWAToken", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const RWAToken = await ethers.getContractFactory("RWAToken");
    const token = await RWAToken.deploy();
    await token.waitForDeployment();
    return { token, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("RealWorldAsset");
      expect(await token.symbol()).to.equal("RWA");
    });

    it("Should set the deployer as owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should have zero minted tokens initially", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalMinted()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a token and assign it to the recipient", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      await token.mint(addr1.address, "https://example.com/meta/1");
      expect(await token.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should return the correct tokenId", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const tx = await token.mint(addr1.address, "https://example.com/meta/1");
      const receipt = await tx.wait();
      // Token ID should be 1 for the first mint
      expect(await token.totalMinted()).to.equal(1);
    });

    it("Should set the correct tokenURI", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const uri = "https://example.com/meta/1";
      await token.mint(addr1.address, uri);
      expect(await token.tokenURI(1)).to.equal(uri);
    });

    it("Should emit a TokenMinted event", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      const uri = "https://example.com/meta/1";
      await expect(token.mint(addr1.address, uri))
        .to.emit(token, "TokenMinted")
        .withArgs(1, addr1.address, uri);
    });

    it("Should increment token IDs for multiple mints", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTokenFixture);
      await token.mint(addr1.address, "https://example.com/meta/1");
      await token.mint(addr2.address, "https://example.com/meta/2");
      await token.mint(addr1.address, "https://example.com/meta/3");

      expect(await token.ownerOf(1)).to.equal(addr1.address);
      expect(await token.ownerOf(2)).to.equal(addr2.address);
      expect(await token.ownerOf(3)).to.equal(addr1.address);
      expect(await token.totalMinted()).to.equal(3);
    });

    it("Should allow minting multiple tokens to the same address", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      await token.mint(addr1.address, "uri1");
      await token.mint(addr1.address, "uri2");
      expect(await token.balanceOf(addr1.address)).to.equal(2);
    });
  });

  describe("Access Control", function () {
    it("Should revert when non-owner tries to mint", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      await expect(
        token.connect(addr1).mint(addr1.address, "uri")
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token URI", function () {
    it("Should revert for non-existent token", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      await expect(token.tokenURI(999)).to.be.revertedWithCustomError(
        token,
        "ERC721NonexistentToken"
      );
    });

    it("Should return different URIs for different tokens", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      await token.mint(addr1.address, "uri-alpha");
      await token.mint(addr1.address, "uri-beta");
      expect(await token.tokenURI(1)).to.equal("uri-alpha");
      expect(await token.tokenURI(2)).to.equal("uri-beta");
    });
  });

  describe("ERC721 Standard", function () {
    it("Should support ERC721 interface", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      // ERC721 interfaceId = 0x80ac58cd
      expect(await token.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      // ERC721Metadata interfaceId = 0x5b5e139f
      expect(await token.supportsInterface("0x5b5e139f")).to.be.true;
    });

    it("Should handle approve and transferFrom", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      await token.mint(addr1.address, "uri");

      await token.connect(addr1).approve(addr2.address, 1);
      expect(await token.getApproved(1)).to.equal(addr2.address);

      await token.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
      expect(await token.ownerOf(1)).to.equal(addr2.address);
    });
  });
});
