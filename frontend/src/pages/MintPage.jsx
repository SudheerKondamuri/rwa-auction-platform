import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Contract, JsonRpcProvider } from 'ethers';
import { CONTRACT_ADDRESSES, RPC_URL } from '../utils/contractAddresses';
import RWATokenABI from '../utils/abis/RWAToken.json';
import { useWalletStore } from '../stores/walletStore';
import { useNFTStore } from '../stores/nftStore';
import { generateGradient } from '../utils/formatters';
import { Building2, Home, Landmark, Gem, Paintbrush, PlusCircle, AlertTriangle, Eye, ShieldAlert, Award } from 'lucide-react';
import { motion } from 'framer-motion';

function NFTIcon({ category, className = "w-16 h-16 text-white" }) {
  switch (category) {
    case 'real-estate': return <Building2 className={className} />;
    case 'art': return <Paintbrush className={className} />;
    case 'commodity': return <Gem className={className} />;
    case 'vehicle': return <Home className={className} />;
    default: return <Landmark className={className} />;
  }
}

export default function MintPage() {
  const { signer, account, provider } = useWalletStore();
  const { mintNFT, fetchMyNFTs } = useNFTStore();
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', category: 'real-estate' });
  const [loading, setLoading] = useState(false);
  const [contractOwner, setContractOwner] = useState(null);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const prov = provider || new JsonRpcProvider(RPC_URL);
        const contract = new Contract(CONTRACT_ADDRESSES.RWA_TOKEN, RWATokenABI, prov);
        const ownerAddress = await contract.owner();
        setContractOwner(ownerAddress);
      } catch (err) {
        console.error("Failed to fetch contract owner:", err);
      }
    };
    fetchOwner();
  }, [provider]);

  const isOwner = account && contractOwner && account.toLowerCase() === contractOwner.toLowerCase();

  const tokenURI = `data:application/json;base64,${btoa(
    JSON.stringify({
      name: form.name || 'Untitled Asset',
      description: form.description || 'A tokenized real-world asset',
      image: form.imageUrl || '',
      attributes: [{ trait_type: 'Category', value: form.category }],
    })
  )}`;

  const handleMint = async () => {
    if (!signer || !account) return toast.error('Connect your wallet');
    if (!isOwner) return toast.error('Only the contract owner can tokenize assets');
    if (!form.name) return toast.error('Please enter an asset name');
    setLoading(true);
    try {
      await mintNFT(signer, account, tokenURI);
      toast.success('Asset tokenized and minted successfully!');
      setForm({ name: '', description: '', imageUrl: '', category: 'real-estate' });
      fetchMyNFTs(account);
    } catch (error) {
      toast.error(error?.reason || error?.message || 'Mint failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-white">
          Tokenize <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">New Asset</span>
        </h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Convert a physical real-world asset into an on-chain ERC-721 NFT.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Form */}
        <div className="glass-card p-8 flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Asset Name *</label>
            <input
              type="text"
              disabled={!isOwner}
              className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              placeholder={isOwner ? "e.g., Manhattan Office Tower" : "Minting is locked"}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Description</label>
            <textarea
              disabled={!isOwner}
              className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
              rows={3}
              placeholder={isOwner ? "Describe the physical asset, location, valuation, etc..." : "Minting is locked"}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Image URL (Optional)</label>
            <input
              type="text"
              disabled={!isOwner}
              className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              placeholder="https://example.com/asset-photo.jpg"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Category</label>
            <select
              disabled={!isOwner}
              className="px-4 py-3 bg-bg-primary/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="real-estate">Real Estate</option>
              <option value="art">Art & Fine Collectibles</option>
              <option value="commodity">Precious Metals & Commodities</option>
              <option value="vehicle">Vehicles & Heavy Equipment</option>
              <option value="other">Other Assets</option>
            </select>
          </div>

          <button
            onClick={handleMint}
            disabled={loading || !account || !isOwner}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light rounded-xl font-bold text-sm text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>{loading ? 'Minting...' : 'Mint RWA NFT'}</span>
          </button>

          {!account && (
            <div className="flex items-center gap-2 text-warning bg-warning/10 border border-warning/20 p-3 rounded-xl text-xs font-medium mt-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Connect your wallet to verify platform access control status.</span>
            </div>
          )}

          {account && !isOwner && (
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-brand-subtle/10 border border-brand/20 text-left text-sm text-brand-light">
              <div className="flex items-center gap-2.5 font-heading font-extrabold text-white text-base">
                <ShieldAlert className="w-5 h-5 text-brand" />
                <span>RWA Access Control & Legality</span>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">
                In a production <strong>Real-World Asset (RWA)</strong> system, individual users cannot mint assets arbitrarily. 
                Instead, physical titles, land registry deeds, or ownership certificates must be verified offline by qualified legal authorities 
                and tokenized by the official contract manager (Platform Administrator).
              </p>
              <div className="flex items-start gap-2 text-[11px] text-text-muted mt-1">
                <Award className="w-3.5 h-3.5 text-brand flex-shrink-0 mt-0.5" />
                <span>
                  Only the contract owner can call the on-chain minting logic. 
                  To test minting locally, please connect MetaMask to the deployer account: 
                  <code className="block mt-1 p-1.5 bg-black/40 rounded font-mono text-[9px] text-white select-all">0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</code>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="sticky top-28 flex flex-col gap-4 text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            <Eye className="w-4 h-4" />
            <span>Live Asset Preview</span>
          </div>

          <div className="glass-card overflow-hidden border border-white/10 shadow-glow max-w-sm w-full mx-auto md:mx-0">
            <div
              className="h-[200px] flex items-center justify-center relative overflow-hidden"
              style={{ background: generateGradient(1234) }}
            >
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="w-20 h-20 rounded-3xl bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
                <NFTIcon category={form.category} />
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-heading font-extrabold text-xl text-white">
                  {form.name || 'Untitled Asset'}
                </h3>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                  {form.description || 'A tokenized real-world asset details will be shown here.'}
                </p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-brand-subtle text-brand-light border border-brand/20">
                  {form.category.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
