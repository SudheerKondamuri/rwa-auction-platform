import { useState } from 'react';
import { parseEther } from 'ethers';
import toast from 'react-hot-toast';
import { useWalletStore } from '../stores/walletStore';
import { useAuctionStore } from '../stores/auctionStore';
import { formatEth } from '../utils/formatters';
import { Gavel, TrendingUp, Info } from 'lucide-react';

export default function BidPanel({ auction }) {
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { signer, account } = useWalletStore();
  const { placeBid } = useAuctionStore();

  const minBid = auction.highestBid > 0n
    ? auction.highestBid + 1n
    : auction.startingPrice;

  const handleBid = async () => {
    if (!signer || !account) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!bidAmount) {
      toast.error('Please enter a bid amount');
      return;
    }
    setLoading(true);
    try {
      const amount = parseEther(bidAmount);
      await placeBid(signer, auction.auctionId, amount);
      toast.success('Bid placed successfully!');
      setBidAmount('');
    } catch (error) {
      const msg = error?.reason || error?.message || 'Transaction failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col text-left">
          <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Highest Bid</span>
          <span className="font-heading font-extrabold text-2xl text-success mt-1" data-test-id="current-highest-bid">
            {auction.highestBid > 0n ? formatEth(auction.highestBid) : 'No bids yet'}
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-success" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            className="flex-1 px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand transition-all font-mono"
            placeholder="Enter bid in ETH"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            disabled={loading}
            data-test-id="bid-amount-input"
          />
          <button
            onClick={handleBid}
            disabled={loading || !account}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-sm text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
            data-test-id="place-bid-button"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Gavel className="w-4 h-4" />
            )}
            <span>{loading ? 'Bidding...' : 'Place Bid'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1 text-left">
          <Info className="w-3.5 h-3.5" />
          <span>Minimum Bid: <span className="font-semibold text-text-secondary">{formatEth(minBid)}</span></span>
        </div>
      </div>
    </div>
  );
}
