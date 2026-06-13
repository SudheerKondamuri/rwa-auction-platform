import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import { useAuctionStore } from '../stores/auctionStore';
import { useNFTStore } from '../stores/nftStore';
import { truncateAddress } from '../utils/formatters';
import { Compass, Flame, BarChart3, Coins, PlusCircle, Folder, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { account } = useWalletStore();
  const { auctions, activeAuctionIds, fetchAuctions } = useAuctionStore();
  const { myNFTs, fetchMyNFTs } = useNFTStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }
    fetchAuctions();
    fetchMyNFTs(account);
  }, [account]);

  const myAuctions = activeAuctionIds.filter(
    (id) => auctions[id]?.seller?.toLowerCase() === account?.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white flex items-center gap-2">
            Welcome back, <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">{truncateAddress(account)}</span>
          </h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2">Manage your tokenized assets and active auctions.</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl text-xs font-semibold text-brand-light w-max">
          <Sparkles className="w-4 h-4 text-brand animate-pulse" />
          <span>Local Node Connected</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { icon: Folder, value: myNFTs.length, label: 'My Collection', color: 'text-brand' },
          { icon: Flame, value: myAuctions.length, label: 'My Auctions', color: 'text-error' },
          { icon: BarChart3, value: activeAuctionIds.length, label: 'Active Auctions', color: 'text-accent' },
          { icon: Coins, value: '—', label: 'Total Volume', color: 'text-gold' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 flex flex-col gap-3 cursor-pointer hover:glass-card-hover"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{stat.label}</span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="font-heading font-extrabold text-3xl text-white mt-1">
                {stat.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h2 className="font-heading font-extrabold text-2xl text-white mb-6">
        Quick Actions
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            icon: PlusCircle,
            title: 'Mint NFT',
            desc: 'Tokenize a new real-world asset instantly',
            path: '/mint',
            color: 'from-brand to-brand-hover',
          },
          {
            icon: Compass,
            title: 'Browse Auctions',
            desc: 'Search, bid, and purchase tokenized RWAs',
            path: '/auctions',
            color: 'from-accent to-accent-hover',
          },
          {
            icon: Folder,
            title: 'My Collection',
            desc: 'View, transfer, or list your assets for sale',
            path: '/my-nfts',
            color: 'from-gold to-gold-hover',
          },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              onClick={() => navigate(action.path)}
              className="glass-card p-8 flex flex-col items-center text-center gap-4 cursor-pointer hover:glass-card-hover"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-subtle flex items-center justify-center border border-white/5 shadow-glow">
                <Icon className="w-7 h-7 text-brand-light" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-white">{action.title}</h3>
                <p className="text-text-secondary text-sm mt-2">{action.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
