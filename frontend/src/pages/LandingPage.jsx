import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import { Building2, Coins, ShieldCheck, Zap, Users, Flame, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

function Hero3DCard() {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rY = ((x / rect.width) - 0.5) * 20;
    const rX = ((y / rect.height) - 0.5) * -20;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="perspective-1000 w-full max-w-[320px] mx-auto mt-12 md:mt-0">
      <motion.div
        ref={cardRef}
        className="w-full aspect-[4/5] glass-card p-6 flex flex-col items-center justify-center gap-6 cursor-pointer border border-white/10"
        animate={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.03 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20 shadow-glow">
          <Building2 className="w-8 h-8 text-brand" />
        </div>
        <div className="text-center">
          <h3 className="font-heading font-extrabold text-xl text-white">Premium Estate #001</h3>
          <p className="text-xs text-text-secondary mt-1">Manhattan Commercial Property</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-text-muted uppercase tracking-wider">Current Value</span>
          <span className="font-heading font-extrabold text-2xl text-success">12.5 ETH</span>
        </div>
        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-success/20 text-success border border-success/30 rounded-full animate-pulse">
          Live Auction
        </span>
      </motion.div>
    </div>
  );
}

function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 4}px`,
      duration: `${8 + Math.random() * 10}s`,
      delay: `${Math.random() * 6}s`,
      driftX: `${(Math.random() - 0.5) * 150}px`,
      driftY: `${-80 - Math.random() * 150}px`,
      color: i % 3 === 0
        ? 'rgba(197, 168, 128, 0.25)' // Champagne Gold
        : i % 3 === 1
        ? 'rgba(139, 115, 85, 0.2)'    // Bronze
        : 'rgba(250, 249, 246, 0.15)', // Warm Alabaster White
    })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            filter: 'blur(1px)',
            animation: `particleDrift ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
            '--drift-x': p.driftX,
            '--drift-y': p.driftY,
          }}
        />
      ))}
    </div>
  );
}

function StatsBar() {
  const stats = [
    { value: '150+', label: 'Assets Tokenized', icon: Building2 },
    { value: '2,400', label: 'ETH Volume', icon: Coins },
    { value: '890', label: 'Active Users', icon: Users },
    { value: '45', label: 'Live Auctions', icon: Flame },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-6 py-12">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:glass-card-hover"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-brand" />
            </div>
            <div className="font-heading font-extrabold text-2xl bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const { connectWallet, account } = useWalletStore();

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-primary text-white">
      {/* Floating Orbs background */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand/10 blur-[120px] top-[-10%] left-[-10%] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] bottom-[-10%] right-[-5%] pointer-events-none" />
      <Particles />

      {/* Hero Header */}
      <header className="fixed top-4 left-4 right-4 z-50 glass rounded-2xl px-6 h-16 flex items-center justify-between border border-white/10 shadow-glow">
        <div className="flex items-center gap-2 font-heading font-extrabold text-xl tracking-tight">
          <Building2 className="w-6 h-6 text-brand" />
          <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">
            RWA Auction
          </span>
        </div>
        {account ? (
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light border border-brand/30 rounded-xl text-xs font-semibold text-white shadow-glow transition-all cursor-pointer"
          >
            <span>Open App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-4 py-2 bg-brand-subtle hover:bg-brand/20 border border-brand/30 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
            data-test-id="connect-wallet-button"
          >
            <Coins className="w-4 h-4 text-brand" />
            <span>Connect Wallet</span>
          </button>
        )}
      </header>

      {/* Hero Content Section */}
      <section className="pt-36 pb-16 px-6 max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-center min-h-[85vh]">
        <div className="md:col-span-7 flex flex-col justify-center text-left">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-subtle border border-brand/20 rounded-full text-xs font-semibold text-brand-light mb-6">
              <Star className="w-3.5 h-3.5 fill-brand-light" />
              <span>Next-Gen RWA Asset Tokenization</span>
            </div>
            <h1 className="font-heading font-extrabold text-4xl sm:text-6xl tracking-tight leading-tight mb-6">
              Decentralize & Auction{' '}
              <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">
                Real-World Assets
              </span>
            </h1>
            <p className="text-text-secondary text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
              The premier decentralized marketplace for tokenized real estate, art, and commodities.
              Transparent on-chain auctions, instant settlement, zero intermediaries.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={account ? '/auctions' : '#'} onClick={!account ? connectWallet : undefined}>
                <button className="px-6 py-3 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light border border-brand/30 rounded-xl text-sm font-bold shadow-glow hover:shadow-glow-lg transition-all flex items-center gap-2 cursor-pointer">
                  <span>Launch Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href="#features">
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold hover:border-white/20 transition-all cursor-pointer">
                  Learn More
                </button>
              </a>
            </div>
          </motion.div>
        </div>

        <div className="md:col-span-5 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Hero3DCard />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsBar />

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white mb-4">
            Why Choose RWA Auction?
          </h2>
          <p className="text-text-secondary text-sm sm:text-base">
            Secure, regulatory-compliant, and fully open-source framework designed for trustless auctions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Coins,
              title: 'Tokenize Assets',
              desc: 'Convert physical assets like property deeds or art registries into ERC-721 tokenized smart contracts with immutable metadata.',
            },
            {
              icon: ShieldCheck,
              title: 'Transparent Auctions',
              desc: 'Support for high-end English (ascending) and Dutch (descending) bid architectures. Smart-contract escrow ensures fund security.',
            },
            {
              icon: Zap,
              title: 'Instant Settlement',
              desc: 'Automatically settle property rights transfers. No escrow agents, zero delays, and instant payout processing.',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-8 flex flex-col items-start gap-4 cursor-pointer hover:glass-card-hover"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-white mt-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-white">
            <Building2 className="w-4 h-4 text-brand" />
            <span>RWA Auction Platform</span>
          </div>
          <p>© 2026 RWA Auction Platform. All rights reserved on-chain.</p>
        </div>
      </footer>
    </div>
  );
}
