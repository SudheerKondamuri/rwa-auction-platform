const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy RWAToken
  console.log("\n--- Deploying RWAToken ---");
  const RWAToken = await hre.ethers.getContractFactory("RWAToken");
  const rwaToken = await RWAToken.deploy();
  await rwaToken.waitForDeployment();
  const rwaTokenAddress = await rwaToken.getAddress();
  console.log("RWAToken deployed to:", rwaTokenAddress);

  // Deploy AuctionHouse
  console.log("\n--- Deploying AuctionHouse ---");
  const AuctionHouse = await hre.ethers.getContractFactory("AuctionHouse");
  const auctionHouse = await AuctionHouse.deploy();
  await auctionHouse.waitForDeployment();
  const auctionHouseAddress = await auctionHouse.getAddress();
  console.log("AuctionHouse deployed to:", auctionHouseAddress);

  // Mint sample NFTs
  console.log("\n--- Minting sample NFTs ---");
  const sampleURIs = [
    "https://example.com/metadata/1",
    "https://example.com/metadata/2",
    "https://example.com/metadata/3",
    "https://example.com/metadata/4",
    "https://example.com/metadata/5",
  ];

  for (let i = 0; i < sampleURIs.length; i++) {
    const tx = await rwaToken.mint(deployer.address, sampleURIs[i]);
    await tx.wait();
    console.log(`Minted NFT #${i + 1} with URI: ${sampleURIs[i]}`);
  }

  // Create sample active auctions for the first 3 NFTs
  console.log("\n--- Creating sample auctions ---");

  // Approve AuctionHouse for Tokens 1, 2, and 3
  for (let tokenId = 1; tokenId <= 3; tokenId++) {
    const approveTx = await rwaToken.approve(auctionHouseAddress, tokenId);
    await approveTx.wait();
  }

  // Auction 1: English Auction for Token #1
  const ethTx1 = await auctionHouse.createEnglishAuction(
    rwaTokenAddress,
    1,
    hre.ethers.parseEther("1.5"),
    86400 * 7
  );
  await ethTx1.wait();
  console.log("Created English Auction for Token #1 (1.5 ETH starting bid)");

  // Auction 2: English Auction for Token #2
  const ethTx2 = await auctionHouse.createEnglishAuction(
    rwaTokenAddress,
    2,
    hre.ethers.parseEther("2.8"),
    86400 * 5
  );
  await ethTx2.wait();
  console.log("Created English Auction for Token #2 (2.8 ETH starting bid)");

  // Auction 3: Dutch Auction for Token #3
  const dutchTx = await auctionHouse.createDutchAuction(
    rwaTokenAddress,
    3,
    hre.ethers.parseEther("10.0"),
    hre.ethers.parseEther("2.0"),
    86400 * 3
  );
  await dutchTx.wait();
  console.log("Created Dutch Auction for Token #3 (10.0 ETH starting, 2.0 ETH floor)");

  // Write submission.json
  const submission = {
    rwaTokenContractAddress: rwaTokenAddress,
    auctionHouseContractAddress: auctionHouseAddress,
    testAccountPrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  };

  const submissionPath = path.join(__dirname, "../../submission.json");
  fs.writeFileSync(submissionPath, JSON.stringify(submission, null, 2));
  console.log("\n--- submission.json written ---");
  console.log(JSON.stringify(submission, null, 2));

  // Write frontend .env
  const envContent = `VITE_RPC_URL=http://localhost:8545
VITE_RWA_TOKEN_ADDRESS=${rwaTokenAddress}
VITE_AUCTION_HOUSE_ADDRESS=${auctionHouseAddress}
`;

  const envPath = path.join(__dirname, "../../frontend/.env");
  try {
    fs.writeFileSync(envPath, envContent);
    console.log("\n--- frontend/.env written ---");
  } catch {
    console.log("\n--- Could not write frontend/.env (frontend dir may not exist yet) ---");
  }

  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
