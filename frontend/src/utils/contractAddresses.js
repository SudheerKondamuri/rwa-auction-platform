export const CONTRACT_ADDRESSES = {
  RWA_TOKEN: import.meta.env.VITE_RWA_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  AUCTION_HOUSE: import.meta.env.VITE_AUCTION_HOUSE_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
};

export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
export const CHAIN_ID = 31337;
