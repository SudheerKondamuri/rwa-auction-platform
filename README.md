# RWA Auction Platform

A production-grade decentralized application (dApp) for auctioning tokenized Real-World Assets (RWAs) built with Solidity, Hardhat, React, and ethers.js.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-363636)
![React](https://img.shields.io/badge/React-18-61DAFB)

## Architecture Overview

The platform consists of two main components:

### Smart Contracts (Solidity ^0.8.20)
- **RWAToken.sol**: ERC-721 NFT contract for tokenizing real-world assets
- **AuctionHouse.sol**: Auction management contract supporting English and Dutch auctions

### Frontend (React + Vite)
- Premium 3D landing page with glassmorphism design
- Multi-screen dApp with real-time blockchain state management
- MetaMask wallet integration via ethers.js v6
- Zustand for state management with optimistic updates

## Quick Start

### Using Docker (Recommended)

```bash
# Start everything with one command
docker-compose up --build
```

This will:
1. Start a local Hardhat node on port 8545
2. Deploy contracts automatically
3. Start the frontend on port 5173

Open http://localhost:5173 in your browser.

### Manual Setup

#### Prerequisites
- Node.js >= 18
- MetaMask browser extension

#### 1. Install Dependencies
```bash
# Install contract dependencies
cd contracts && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

#### 2. Start Local Blockchain
```bash
cd contracts
npx hardhat node
```

#### 3. Deploy Contracts
```bash
# In a new terminal
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

#### 4. Configure Frontend
Update `frontend/.env` with the deployed contract addresses printed by the deploy script.

#### 5. Start Frontend
```bash
cd frontend
npm run dev
```

#### 6. Configure MetaMask
1. Open MetaMask
2. Add a custom network:
   - Network Name: Hardhat Local
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency: ETH
3. Import a test account using one of Hardhat's default private keys

## Testing

```bash
# Run all tests
cd contracts
npx hardhat test

# Run with coverage report
npx hardhat coverage
```

## Project Structure

```
rwa-auction-platform/
├── contracts/                 # Smart contract project (Hardhat)
│   ├── contracts/             # Solidity source files
│   │   ├── RWAToken.sol       # ERC-721 NFT contract
│   │   └── AuctionHouse.sol   # Auction management contract
│   ├── scripts/               # Deployment scripts
│   ├── test/                  # Contract test suite
│   ├── hardhat.config.js      # Hardhat configuration
│   └── Dockerfile             # Docker config for Hardhat node
├── frontend/                  # React application (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Application pages
│   │   ├── stores/            # Zustand state stores
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utilities and ABIs
│   │   └── index.css          # Design system
│   └── Dockerfile             # Docker config for frontend
├── docker-compose.yml         # Docker Compose orchestration
├── submission.json            # Deployed contract addresses
├── .env.example               # Environment template
└── README.md                  # This file
```

## Smart Contract Details

### RWAToken (ERC-721)
- Inherits: ERC721URIStorage, Ownable
- Owner-only minting with auto-incrementing token IDs
- Metadata URI storage per token

### AuctionHouse
- **English Auctions**: Ascending bid model with automatic refunds
- **Dutch Auctions**: Descending price model with instant buy
- Security: ReentrancyGuard, Checks-Effects-Interactions, Pausable
- Events for real-time frontend updates

### Auction Flow

#### English Auction
1. Owner mints NFT via RWAToken
2. Owner approves AuctionHouse to transfer NFT
3. Owner creates English auction (starting bid + duration)
4. Bidders place increasing bids (previous bidder auto-refunded)
5. After deadline, anyone can finalize (NFT → winner, ETH → seller)

#### Dutch Auction
1. Owner mints NFT and approves AuctionHouse
2. Owner creates Dutch auction (start price, end price, duration)
3. Price decreases linearly over time
4. First buyer to accept current price wins instantly

## Security Considerations

- **Reentrancy Protection**: All state-changing functions use `nonReentrant` modifier
- **CEI Pattern**: State updates before external calls
- **Access Control**: Owner-only minting, seller-only cancellation
- **Input Validation**: All function inputs validated with descriptive error messages
- **Emergency Stop**: Pausable functionality for critical situations

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_RPC_URL | Ethereum RPC endpoint | http://localhost:8545 |
| VITE_RWA_TOKEN_ADDRESS | RWAToken contract address | (set after deploy) |
| VITE_AUCTION_HOUSE_ADDRESS | AuctionHouse contract address | (set after deploy) |
| VITE_FRONTEND_PORT | Frontend dev server port | 5173 |

## License

MIT
