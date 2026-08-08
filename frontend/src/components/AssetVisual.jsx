import { useState, useEffect } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { parseTokenURI, generateGradient } from '../utils/formatters';
import { CONTRACT_ADDRESSES, RPC_URL } from '../utils/contractAddresses';
import RWATokenABI from '../utils/abis/RWAToken.json';
import { Building2, Home, Landmark, Gem, Paintbrush } from 'lucide-react';

function NFTIcon({ tokenId, category, className = "w-12 h-12 text-white" }) {
  if (category === 'real-estate') return <Building2 className={className} />;
  if (category === 'art') return <Paintbrush className={className} />;
  if (category === 'commodity') return <Gem className={className} />;
  if (category === 'vehicle') return <Home className={className} />;

  const id = Number(tokenId || 0);
  const icons = [Building2, Home, Landmark, Gem, Paintbrush];
  const IconComponent = icons[id % icons.length];
  return <IconComponent className={className} />;
}

export default function AssetVisual({ tokenId, tokenURI: initialURI, className = "w-full h-full" }) {
  const [metadata, setMetadata] = useState(() => parseTokenURI(initialURI));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (initialURI) {
      const parsed = parseTokenURI(initialURI);
      if (parsed) {
        setMetadata(parsed);
        return;
      }
    }

    if (tokenId && !initialURI) {
      let isMounted = true;
      const fetchURI = async () => {
        try {
          const provider = new JsonRpcProvider(RPC_URL);
          const contract = new Contract(CONTRACT_ADDRESSES.RWA_TOKEN, RWATokenABI, provider);
          const uri = await contract.tokenURI(tokenId);
          const parsed = parseTokenURI(uri);
          if (isMounted && parsed) {
            setMetadata(parsed);
          }
        } catch {
          // Fallback to gradient icon
        }
      };
      fetchURI();
      return () => { isMounted = false; };
    }
  }, [tokenId, initialURI]);

  const hasValidImage = metadata?.image && !imageError;

  if (hasValidImage) {
    return (
      <div className={`relative overflow-hidden bg-black/40 ${className}`}>
        <img
          src={metadata.image}
          alt={metadata.name || `RWA Asset #${tokenId}`}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: generateGradient(tokenId) }}
    >
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="w-16 h-16 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-lg">
        <NFTIcon tokenId={tokenId} category={metadata?.attributes?.[0]?.value} />
      </div>
    </div>
  );
}
