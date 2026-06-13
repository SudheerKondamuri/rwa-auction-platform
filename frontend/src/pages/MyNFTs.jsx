import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import { useNFTStore } from '../stores/nftStore';
import { generateGradient } from '../utils/formatters';
import { Lock, FolderHeart, PlusCircle, Gavel, Building2, Home, Landmark, Gem, Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';

function NFTIcon({ tokenId, className = "w-12 h-12 text-white" }) {
  const id = Number(tokenId);
  const icons = [Building2, Home, Landmark, Gem, Paintbrush];
  const IconComponent = icons[id % icons.length];
  return <IconComponent className={className} />;
}

export default function MyNFTs() {
  const { account } = useWalletStore();
  const { myNFTs, loading, fetchMyNFTs } = useNFTStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (account) fetchMyNFTs(account);
  }, [account]);

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20 px-6 glass-card border border-white/5 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-subtle flex items-center justify-center mb-6 border border-brand/20">
            <Lock className="w-8 h-8 text-brand-light" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-white">Wallet Not Connected</h3>
          <p className="text-text-secondary text-sm mt-2 max-w-sm">
            Please connect your wallet using the button in the navigation bar to view your collection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          My <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">Collection</span>
        </h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Manage your tokenized real-world assets and list them for auction.</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="skeleton h-[180px]" />
              <div className="p-6 space-y-4">
                <div className="skeleton h-5 w-1/2" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : myNFTs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 px-6 glass-card border border-white/5 text-center max-w-xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
            <FolderHeart className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-white">No Assets Found</h3>
          <p className="text-text-secondary text-sm mt-2 max-w-sm">
            You don't own any tokenized assets yet. Mint a new one to get started.
          </p>
          <button
            onClick={() => navigate('/mint')}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-sm text-white shadow-glow cursor-pointer transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mint RWA NFT</span>
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myNFTs.map((nft, i) => (
            <motion.div
              key={nft.tokenId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card hover:glass-card-hover overflow-hidden flex flex-col group h-full text-left"
            >
              <div
                className="h-[180px] w-full flex items-center justify-center relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
                style={{ background: generateGradient(nft.tokenId) }}
              >
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                
                <div className="w-20 h-20 rounded-3xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <NFTIcon tokenId={nft.tokenId} />
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1 gap-6">
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-white">
                    RWA Asset #{nft.tokenId}
                  </h3>
                  <div className="font-mono text-xs text-text-muted mt-1">Token ID: {nft.tokenId}</div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3 mt-auto">
                  <button
                    onClick={() => navigate(`/create-auction/${nft.tokenId}`)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-xs text-white shadow-glow cursor-pointer transition-all duration-200"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Create Auction</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
