import { create } from 'zustand';
import { Contract, JsonRpcProvider } from 'ethers';
import { CONTRACT_ADDRESSES, RPC_URL } from '../utils/contractAddresses';
import AuctionHouseABI from '../utils/abis/AuctionHouse.json';

function getReadOnlyContract() {
  const provider = new JsonRpcProvider(RPC_URL);
  return new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, provider);
}

export const useAuctionStore = create((set, get) => ({
  auctions: {},
  activeAuctionIds: [],
  loading: false,
  error: null,

  fetchAuctions: async () => {
    set({ loading: true, error: null });
    try {
      const contract = getReadOnlyContract();
      const activeIds = await contract.getActiveAuctions();
      const idNumbers = activeIds.map((id) => Number(id));

      const auctionMap = {};
      for (const id of idNumbers) {
        const a = await contract.getAuction(id);
        auctionMap[id] = {
          auctionId: Number(a.auctionId),
          auctionType: Number(a.auctionType),
          status: Number(a.status),
          seller: a.seller,
          nftContract: a.nftContract,
          tokenId: Number(a.tokenId),
          startTime: Number(a.startTime),
          endTime: Number(a.endTime),
          startingPrice: a.startingPrice,
          endPrice: a.endPrice,
          highestBidder: a.highestBidder,
          highestBid: a.highestBid,
        };
      }

      set({ auctions: auctionMap, activeAuctionIds: idNumbers, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSingleAuction: async (auctionId) => {
    try {
      const contract = getReadOnlyContract();
      const a = await contract.getAuction(auctionId);
      const auction = {
        auctionId: Number(a.auctionId),
        auctionType: Number(a.auctionType),
        status: Number(a.status),
        seller: a.seller,
        nftContract: a.nftContract,
        tokenId: Number(a.tokenId),
        startTime: Number(a.startTime),
        endTime: Number(a.endTime),
        startingPrice: a.startingPrice,
        endPrice: a.endPrice,
        highestBidder: a.highestBidder,
        highestBid: a.highestBid,
      };
      set((state) => ({
        auctions: { ...state.auctions, [auctionId]: auction },
      }));
      return auction;
    } catch (error) {
      console.error('fetchSingleAuction error:', error);
      return null;
    }
  },

  placeBid: async (signer, auctionId, amount) => {
    const contract = new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, signer);
    const tx = await contract.placeBid(auctionId, { value: amount });
    await tx.wait();
    await get().fetchSingleAuction(auctionId);
    return tx;
  },

  finalizeAuction: async (signer, auctionId) => {
    const contract = new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, signer);
    const tx = await contract.finalizeAuction(auctionId);
    await tx.wait();
    await get().fetchAuctions();
    return tx;
  },

  buyFromDutchAuction: async (signer, auctionId, price) => {
    const contract = new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, signer);
    const tx = await contract.buyFromDutchAuction(auctionId, { value: price });
    await tx.wait();
    await get().fetchAuctions();
    return tx;
  },

  cancelAuction: async (signer, auctionId) => {
    const contract = new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, signer);
    const tx = await contract.cancelAuction(auctionId);
    await tx.wait();
    await get().fetchAuctions();
    return tx;
  },

  subscribeToEvents: (provider) => {
    const contract = new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, provider);

    contract.on('AuctionCreated', () => get().fetchAuctions());
    contract.on('BidPlaced', (auctionId) => get().fetchSingleAuction(Number(auctionId)));
    contract.on('AuctionFinalized', () => get().fetchAuctions());
    contract.on('AuctionCancelled', () => get().fetchAuctions());

    return () => contract.removeAllListeners();
  },
}));
