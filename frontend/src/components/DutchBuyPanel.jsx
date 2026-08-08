import { useState, useEffect } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import toast from 'react-hot-toast';
import { useWalletStore } from '../stores/walletStore';
import { useAuctionStore } from '../stores/auctionStore';
import { useNFTStore } from '../stores/nftStore';
import { CONTRACT_ADDRESSES, RPC_URL } from '../utils/contractAddresses';
import AuctionHouseABI from '../utils/abis/AuctionHouse.json';
import { formatEth, formatErrorMessage } from '../utils/formatters';
import { ShoppingBag, TrendingDown, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DutchBuyPanel({ auction }) {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signer, account, provider } = useWalletStore();
  const { buyFromDutchAuction } = useAuctionStore();

  useEffect(() => {
    if (account && provider) {
      provider.getBalance(account).then(setUserBalance).catch(() => {});
    }
  }, [account, provider]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const prov = provider || new JsonRpcProvider(RPC_URL);
        const contract = new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, prov);
        const price = await contract.getCurrentPrice(auction.auctionId);
        setCurrentPrice(price);
      } catch (err) {
        console.error('Price fetch error:', err);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [auction.auctionId, provider]);

  const totalDuration = Number(auction.endTime - auction.startTime);
  const elapsed = Math.floor(Date.now() / 1000) - Number(auction.startTime);
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  const hasInsufficientFunds = userBalance !== null && currentPrice !== null && userBalance < currentPrice;

  const handleBuy = async () => {
    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (hasInsufficientFunds) {
      toast.error(`Insufficient ETH balance (${formatEth(userBalance)} available, ${formatEth(currentPrice)} required)`);
      return;
    }
    setLoading(true);
    try {
      // Add 1% buffer for price movement during tx
      const bufferPrice = currentPrice + (currentPrice / 100n);
      await buyFromDutchAuction(signer, auction.auctionId, bufferPrice);
      toast.success('Purchase successful! Asset added to your collection.');
      useNFTStore.getState().fetchMyNFTs(account);
    } catch (error) {
      toast.error(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col text-left">
          <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Current Price (decreasing)</span>
          <span className="font-heading font-extrabold text-2xl text-accent mt-1">
            {currentPrice !== null ? formatEth(currentPrice) : 'Fetching...'}
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <TrendingDown className="w-6 h-6 text-accent" />
        </div>
      </div>

      <div className="space-y-2 text-left">
        <div className="h-2 bg-bg-primary rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - progress}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-accent to-brand rounded-full"
          />
        </div>
        <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase tracking-wider">
          <span>Start: {formatEth(auction.startingPrice)}</span>
          <span>End (Reserve): {formatEth(auction.endPrice)}</span>
        </div>
      </div>

      <button
        onClick={handleBuy}
        disabled={loading || !account || hasInsufficientFunds}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-hover hover:from-accent-hover hover:to-brand rounded-xl font-bold text-sm text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <ShoppingBag className="w-4 h-4" />
        )}
        <span>{loading ? 'Processing...' : 'Buy Now'}</span>
      </button>

      {hasInsufficientFunds && (
        <div className="flex items-center gap-2 text-warning bg-warning/10 border border-warning/20 p-3 rounded-xl text-xs font-medium text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Insufficient funds ({formatEth(userBalance)} available, {formatEth(currentPrice)} needed). Please switch to a funded Hardhat account in MetaMask.</span>
        </div>
      )}
    </div>
  );
}
