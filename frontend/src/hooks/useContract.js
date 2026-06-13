import { useMemo } from 'react';
import { Contract } from 'ethers';
import { useWalletStore } from '../stores/walletStore';
import { CONTRACT_ADDRESSES } from '../utils/contractAddresses';
import RWATokenABI from '../utils/abis/RWAToken.json';
import AuctionHouseABI from '../utils/abis/AuctionHouse.json';

export function useRWATokenContract() {
  const { signer, provider } = useWalletStore();
  return useMemo(() => {
    const signerOrProvider = signer || provider;
    if (!signerOrProvider) return null;
    return new Contract(CONTRACT_ADDRESSES.RWA_TOKEN, RWATokenABI, signerOrProvider);
  }, [signer, provider]);
}

export function useAuctionHouseContract() {
  const { signer, provider } = useWalletStore();
  return useMemo(() => {
    const signerOrProvider = signer || provider;
    if (!signerOrProvider) return null;
    return new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, signerOrProvider);
  }, [signer, provider]);
}
