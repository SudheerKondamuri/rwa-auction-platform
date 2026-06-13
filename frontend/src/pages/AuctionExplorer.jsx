import { useEffect, useState, useMemo } from 'react';
import { useAuctionStore } from '../stores/auctionStore';
import AuctionList from '../components/AuctionList';
import { Gavel, TrendingDown, Clock, RotateCw, Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuctionExplorer() {
  const { auctions, activeAuctionIds, loading, fetchAuctions } = useAuctionStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuctions();
  }, []);

  const filteredAuctions = useMemo(() => {
    let list = activeAuctionIds.map((id) => auctions[id]).filter(Boolean);

    // Type filter
    if (filter === 'english') list = list.filter((a) => a.auctionType === 0);
    if (filter === 'dutch') list = list.filter((a) => a.auctionType === 1);
    if (filter === 'ending') {
      const oneHour = Math.floor(Date.now() / 1000) + 3600;
      list = list.filter((a) => a.endTime <= oneHour && a.endTime > Math.floor(Date.now() / 1000));
    }

    // Search by token ID
    if (search) {
      list = list.filter((a) => String(a.tokenId).includes(search));
    }

    return list;
  }, [auctions, activeAuctionIds, filter, search]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Explore <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">Auctions</span>
        </h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Discover and bid on tokenized real-world assets.</p>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <div className="flex bg-bg-secondary p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'All Assets', icon: SlidersHorizontal },
              { id: 'english', label: 'English Auction', icon: Gavel },
              { id: 'dutch', label: 'Dutch Auction', icon: TrendingDown },
              { id: 'ending', label: 'Ending Soon', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-brand text-white shadow-glow'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 lg:flex-none lg:w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by token ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-secondary border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand transition-all"
            />
          </div>

          <button
            onClick={fetchAuctions}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold hover:border-white/20 transition-all cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <AuctionList auctions={filteredAuctions} loading={loading} />
    </div>
  );
}
