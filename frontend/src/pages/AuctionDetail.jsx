import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuctionStore } from '../stores/auctionStore';
import { useWalletStore } from '../stores/walletStore';
import { useNFTStore } from '../stores/nftStore';
import { formatEth, truncateAddress, formatDate, generateGradient, formatErrorMessage } from '../utils/formatters';
import CountdownTimer from '../components/CountdownTimer';
import BidPanel from '../components/BidPanel';
import DutchBuyPanel from '../components/DutchBuyPanel';
import AssetVisual from '../components/AssetVisual';
import { ArrowLeft, ShieldAlert, Sparkles, CheckCircle2, User, Clock, Calendar, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auctions, fetchSingleAuction, finalizeAuction } = useAuctionStore();
  const { signer, account } = useWalletStore();
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  const auction = auctions[Number(id)];

  useEffect(() => {
    const load = async () => {
      await fetchSingleAuction(Number(id));
      setLoading(false);
    };
    load();
    const interval = setInterval(() => fetchSingleAuction(Number(id)), 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleFinalize = async () => {
    if (!signer) return toast.error('Connect your wallet');
    setFinalizing(true);
    try {
      await finalizeAuction(signer, Number(id));
      toast.success('Auction finalized!');
      if (account) useNFTStore.getState().fetchMyNFTs(account);
    } catch (error) {
      toast.error(formatErrorMessage(error));
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="skeleton h-[400px] rounded-2xl" />
          <div className="space-y-6">
            <div className="skeleton h-10 w-3/5" />
            <div className="skeleton h-6 w-2/5" />
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20 px-6 glass-card border border-white/5 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-error/15 flex items-center justify-center mb-6 border border-error/20">
            <ShieldAlert className="w-8 h-8 text-error" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-white">Auction Not Found</h3>
          <p className="text-text-secondary text-sm mt-2 max-w-sm">
            This auction does not exist or has been removed from the platform.
          </p>
          <button
            onClick={() => navigate('/auctions')}
            className="mt-6 px-6 py-2.5 bg-brand hover:bg-brand-hover rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-glow"
          >
            Browse Auctions
          </button>
        </div>
      </div>
    );
  }

  const isEnglish = auction.auctionType === 0;
  const isActive = auction.status === 0;
  const hasEnded = auction.endTime <= Math.floor(Date.now() / 1000);
  const canFinalize = isEnglish && isActive && hasEnded;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate('/auctions')}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-white text-sm font-semibold mb-8 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Auctions</span>
      </button>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Left: NFT Display */}
        <div className="aspect-[4/3] md:aspect-square w-full relative overflow-hidden rounded-3xl border border-white/10 shadow-glow">
          <AssetVisual tokenId={auction.tokenId} className="w-full h-full" />
        </div>

        {/* Right: Info Panel */}
        <div className="flex flex-col gap-6 text-left">
          <div>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
              RWA Asset #{auction.tokenId}
            </h1>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${
                isEnglish
                  ? 'bg-brand-subtle text-brand-light border-brand/20'
                  : 'bg-accent/15 text-accent-hover border-accent/20'
              }`}>
                {isEnglish ? 'English Auction' : 'Dutch Auction'}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${
                isActive
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-white/5 text-text-secondary border-white/10'
              }`}>
                {isActive ? 'Active' : auction.status === 1 ? 'Finalized' : 'Cancelled'}
              </span>
            </div>
          </div>

          {/* Details Table Card */}
          <div className="glass-card p-6 border border-white/10">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-text-muted mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Seller</span>
                  <span className="font-mono text-sm text-white mt-1">{truncateAddress(auction.seller)}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-text-muted mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Time Remaining</span>
                  <div className="mt-1">
                    <CountdownTimer endTime={auction.endTime} />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-text-muted mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Started</span>
                  <span className="text-sm text-white mt-1">{formatDate(auction.startTime)}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Coins className="w-4 h-4 text-text-muted mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                    {isEnglish ? 'Starting Price' : 'Price Range'}
                  </span>
                  <span className="text-sm font-semibold text-white mt-1">
                    {isEnglish
                      ? formatEth(auction.startingPrice)
                      : `${formatEth(auction.endPrice)} – ${formatEth(auction.startingPrice)}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Action Panel */}
          {isActive && isEnglish && !hasEnded && <BidPanel auction={auction} />}
          {isActive && !isEnglish && !hasEnded && <DutchBuyPanel auction={auction} />}

          {/* Finalized / Purchased Card */}
          {auction.status === 1 && (
            <div className="glass-card p-6 border border-success/30 bg-success/10 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-3 text-success">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="font-heading font-bold text-base text-white">Auction Finalized & Asset Settled</h4>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {isEnglish 
                      ? (auction.highestBidder !== '0x0000000000000000000000000000000000000000'
                          ? `Won by ${truncateAddress(auction.highestBidder)} for ${formatEth(auction.highestBid)}.`
                          : 'Auction ended with no bids. Token returned to seller.')
                      : `Asset successfully purchased in Dutch Auction.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/my-nfts')}
                className="w-full py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-xs text-white shadow-glow transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Asset in My Collection</span>
              </button>
            </div>
          )}

          {/* Cancelled Card */}
          {auction.status === 2 && (
            <div className="glass-card p-6 border border-white/10 bg-white/5 flex items-center gap-3 text-left text-text-muted">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div>
                <h4 className="font-heading font-bold text-sm text-white">Auction Cancelled</h4>
                <p className="text-xs text-text-secondary mt-0.5">This auction was cancelled by the seller.</p>
              </div>
            </div>
          )}

          {canFinalize && (
            <button
              onClick={handleFinalize}
              disabled={finalizing || !account}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-sm text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
            >
              {finalizing ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{finalizing ? 'Finalizing...' : 'Finalize Auction'}</span>
            </button>
          )}

          {/* Highest Bidder Info */}
          {isEnglish && auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
            <div className="mt-4">
              <h3 className="font-heading font-bold text-sm text-white mb-3">Current Highest Bidder</h3>
              <div className="glass-card p-4 flex justify-between items-center bg-brand-subtle/20 border border-brand/20">
                <span className="font-mono text-sm text-text-secondary">{truncateAddress(auction.highestBidder)}</span>
                <span className="font-heading font-extrabold text-base text-success">{formatEth(auction.highestBid)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
