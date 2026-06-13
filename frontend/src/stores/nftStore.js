import { create } from 'zustand';
import { Contract, JsonRpcProvider } from 'ethers';
import { CONTRACT_ADDRESSES, RPC_URL } from '../utils/contractAddresses';
import RWATokenABI from '../utils/abis/RWAToken.json';

export const useNFTStore = create((set) => ({
  myNFTs: [],
  loading: false,
  error: null,

  fetchMyNFTs: async (account) => {
    if (!account) return;
    set({ loading: true, error: null });
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(CONTRACT_ADDRESSES.RWA_TOKEN, RWATokenABI, provider);
      const totalMinted = Number(await contract.totalMinted());

      const nfts = [];
      for (let i = 1; i <= totalMinted; i++) {
        try {
          const owner = await contract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const uri = await contract.tokenURI(i);
            nfts.push({ tokenId: i, tokenURI: uri, owner });
          }
        } catch {
          // Token may be burned or transferred
        }
      }

      set({ myNFTs: nfts, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  mintNFT: async (signer, to, tokenURI) => {
    const contract = new Contract(CONTRACT_ADDRESSES.RWA_TOKEN, RWATokenABI, signer);
    const tx = await contract.mint(to, tokenURI);
    const receipt = await tx.wait();
    return { tx, receipt };
  },

  approveForAuction: async (signer, tokenId) => {
    const contract = new Contract(CONTRACT_ADDRESSES.RWA_TOKEN, RWATokenABI, signer);
    const tx = await contract.approve(CONTRACT_ADDRESSES.AUCTION_HOUSE, tokenId);
    await tx.wait();
    return tx;
  },
}));
