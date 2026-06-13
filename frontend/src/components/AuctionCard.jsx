import { useNavigate } from 'react-router-dom';
import { formatEth, truncateAddress, generateGradient } from '../utils/formatters';
import CountdownTimer from './CountdownTimer';
import { Building2, Home, Landmark, Gem, Paintbrush, ArrowRight, User } from 'lucide-react';
import { motion } from 'framer-motion';

function NFTIcon({ tokenId, className = "w-12 h-12 text-white" }) {
  const id = Number(tokenId);
  const icons = [Building2, Home, Landmark, Gem, Paintbrush];
  const IconComponent = icons[id % icons.length];
  return <IconComponent className={className} />;
}

export default function AuctionCard({ auction }) {
  const navigate = useNavigate();

  const typeName = auction.auctionType === 0 ? 'English' : 'Dutch';
  const isEnglish = auction.auctionType === 0;
  const currentPrice = isEnglish
    ? (auction.highestBid > 0n ? auction.highestBid : auction.startingPrice)
    : auction.startingPrice;

  return (
    <div
      onClick={() => navigate(`/auction/${auction.auctionId}`)}
      className="glass-card hover:glass-card-hover overflow-hidden cursor-pointer flex flex-col group h-full"
      data-test-id="auction-item"
    >
      {/* Visual Header / RWA Artwork representation */}
      <div
        className="h-[180px] w-full flex items-center justify-center relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
        style={{ background: generateGradient(auction.tokenId) }}
      >
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Icon wrapper */}
        <div className="w-20 h-20 rounded-3xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-lg">
          <NFTIcon tokenId={auction.tokenId} />
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-lg text-white group-hover:text-brand-light transition-colors">
            RWA Asset #{auction.tokenId}
          </h3>
          <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${
            isEnglish
              ? 'bg-brand-subtle text-brand-light border-brand/20'
              : 'bg-accent/15 text-accent-hover border-accent/20'
          }`}>
            {typeName}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              {isEnglish ? 'Current Bid' : 'Starting Price'}
            </span>
            <span className="font-heading font-extrabold text-base text-success mt-1">
              {formatEth(currentPrice)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Time Left</span>
            <span className="text-sm font-semibold text-white mt-1">
              <CountdownTimer endTime={auction.endTime} />
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-text-secondary mt-auto">
          <div className="flex items-center gap-1.5 font-mono">
            <User className="w-3.5 h-3.5 text-text-muted" />
            <span>{truncateAddress(auction.seller)}</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand-light group-hover:translate-x-1 transition-transform">
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
