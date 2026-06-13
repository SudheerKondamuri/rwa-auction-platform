import AuctionCard from './AuctionCard';
import { Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuctionList({ auctions, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-test-id="auction-list">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <div className="skeleton h-[200px]" />
            <div className="p-6 space-y-4">
              <div className="skeleton h-5 w-3/5" />
              <div className="skeleton h-4 w-2/5" />
              <div className="skeleton h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!auctions || auctions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 px-6 glass-card border border-white/5 text-center max-w-xl mx-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
          <Inbox className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="font-heading font-extrabold text-xl text-white">No Active Auctions</h3>
        <p className="text-text-secondary text-sm mt-2 max-w-sm">
          Be the first to list and auction a tokenized asset on the platform.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-test-id="auction-list">
      {auctions.map((auction, i) => (
        <motion.div
          key={auction.auctionId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <AuctionCard auction={auction} />
        </motion.div>
      ))}
    </div>
  );
}
