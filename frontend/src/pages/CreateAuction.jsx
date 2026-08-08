import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parseEther } from 'ethers';
import toast from 'react-hot-toast';
import { useWalletStore } from '../stores/walletStore';
import { useNFTStore } from '../stores/nftStore';
import { CONTRACT_ADDRESSES } from '../utils/contractAddresses';
import { generateGradient, formatErrorMessage } from '../utils/formatters';
import { Building2, Home, Landmark, Gem, Paintbrush, ArrowLeft, Check, Key, Gavel, TrendingDown, Hourglass } from 'lucide-react';
import { motion } from 'framer-motion';

function NFTIcon({ tokenId, className = "w-16 h-16 text-white" }) {
  const id = Number(tokenId);
  const icons = [Building2, Home, Landmark, Gem, Paintbrush];
  const IconComponent = icons[id % icons.length];
  return <IconComponent className={className} />;
}

export default function CreateAuction() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { signer, account } = useWalletStore();
  const { approveForAuction } = useNFTStore();

  const [auctionType, setAuctionType] = useState('english');
  const [startingBid, setStartingBid] = useState('0.1');
  const [startPrice, setStartPrice] = useState('1.0');
  const [endPrice, setEndPrice] = useState('0.1');
  const [duration, setDuration] = useState('24'); // hours
  const [step, setStep] = useState(1); // 1 = approve, 2 = create
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!signer) return toast.error('Connect your wallet');
    setLoading(true);
    try {
      await approveForAuction(signer, Number(tokenId));
      toast.success('NFT approved for auction!');
      setStep(2);
    } catch (error) {
      toast.error(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!signer) return toast.error('Connect your wallet');
    setLoading(true);
    try {
      const { Contract } = await import('ethers');
      const AuctionHouseABI = (await import('../utils/abis/AuctionHouse.json')).default;
      const contract = new Contract(CONTRACT_ADDRESSES.AUCTION_HOUSE, AuctionHouseABI, signer);
      const durationSecs = Math.floor(Number(duration) * 3600);

      let tx;
      if (auctionType === 'english') {
        const bid = parseEther(startingBid || '0.1');
        tx = await contract.createEnglishAuction(CONTRACT_ADDRESSES.RWA_TOKEN, Number(tokenId), bid, durationSecs);
      } else {
        const start = parseEther(startPrice || '1');
        const end = parseEther(endPrice || '0.1');
        tx = await contract.createDutchAuction(CONTRACT_ADDRESSES.RWA_TOKEN, Number(tokenId), start, end, durationSecs);
      }
      await tx.wait();
      toast.success('Auction created successfully!');
      navigate('/auctions');
    } catch (error) {
      toast.error(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate('/my-nfts')}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-white text-sm font-semibold mb-8 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Collection</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Create <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">New Auction</span>
        </h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">List RWA Asset #{tokenId} for public auction.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Form panel */}
        <div className="glass-card p-8 flex flex-col gap-8 text-left">
          {/* Step Indicator */}
          <div className="flex items-center justify-between bg-bg-primary/50 border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                step > 1
                  ? 'bg-success border-success text-white'
                  : 'bg-brand border-brand text-white'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                step > 1 ? 'text-success' : 'text-white'
              }`}>Approve</span>
            </div>
            <div className="flex-1 h-[2px] bg-white/5 mx-4" />
            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border ${
                step === 2
                  ? 'bg-brand border-brand text-white'
                  : 'border-white/15 text-text-muted'
              }`}>
                2
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                step === 2 ? 'text-white' : 'text-text-muted'
              }`}>Create</span>
            </div>
          </div>

          {step === 1 ? (
            <div className="flex flex-col gap-6">
              <p className="text-text-secondary text-sm leading-relaxed">
                Before listing the asset, you must authorize the AuctionHouse contract to safely escrow and transfer your NFT once the auction is completed.
              </p>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-sm text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>{loading ? 'Approving...' : 'Approve NFT Transfer'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Type Toggle */}
              <div className="flex bg-bg-primary/50 border border-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setAuctionType('english')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    auctionType === 'english'
                      ? 'bg-brand text-white shadow-glow'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>English Auction</span>
                </button>
                <button
                  onClick={() => setAuctionType('dutch')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    auctionType === 'dutch'
                      ? 'bg-brand text-white shadow-glow'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Dutch Auction</span>
                </button>
              </div>

              {auctionType === 'english' ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Starting Bid (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand transition-all font-mono"
                    placeholder="0.1"
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Start Price (ETH)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand transition-all font-mono"
                      placeholder="1.0"
                      value={startPrice}
                      onChange={(e) => setStartPrice(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">End Reserve (ETH)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand transition-all font-mono"
                      placeholder="0.1"
                      value={endPrice}
                      onChange={(e) => setEndPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand transition-all font-mono"
                  placeholder="24"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-sm text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Gavel className="w-4 h-4" />
                )}
                <span>{loading ? 'Creating Listing...' : 'Create Auction Listing'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-4 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">Listing Preview</div>
          
          <div className="glass-card overflow-hidden border border-white/10 shadow-glow max-w-sm w-full mx-auto md:mx-0">
            <div
              className="h-[200px] flex items-center justify-center relative overflow-hidden"
              style={{ background: generateGradient(tokenId) }}
            >
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="w-20 h-20 rounded-3xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
                <NFTIcon tokenId={tokenId} />
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-extrabold text-lg text-white">
                  RWA Asset #{tokenId}
                </h3>
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${
                  auctionType === 'english'
                    ? 'bg-brand-subtle text-brand-light border-brand/20'
                    : 'bg-accent/15 text-accent-hover border-accent/20'
                }`}>
                  {auctionType === 'english' ? 'English' : 'Dutch'}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/5 text-xs text-text-secondary">
                <Hourglass className="w-4 h-4 text-brand-light" />
                <span>Duration: <span className="font-semibold text-white">{duration || '24'} hours</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
