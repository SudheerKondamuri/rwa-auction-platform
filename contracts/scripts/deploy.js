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
  ];

  for (let i = 0; i < sampleURIs.length; i++) {
    const tx = await rwaToken.mint(deployer.address, sampleURIs[i]);
    await tx.wait();
    console.log(`Minted NFT #${i + 1} with URI: ${sampleURIs[i]}`);
  }

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
