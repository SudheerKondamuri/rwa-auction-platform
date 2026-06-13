import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWalletStore } from '../stores/walletStore';
import { truncateAddress } from '../utils/formatters';
import { Gavel, Wallet, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { account, isConnecting, connectWallet, disconnectWallet } = useWalletStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 glass rounded-2xl px-6 h-16 flex items-center justify-between border border-white/10 shadow-glow">
      <Link to="/" className="flex items-center gap-2 font-heading font-extrabold text-xl tracking-tight cursor-pointer">
        <Gavel className="w-6 h-6 text-brand animate-pulse" />
        <span className="bg-gradient-to-r from-brand via-brand-light to-accent bg-clip-text text-transparent">
          RWA Auction
        </span>
      </Link>

      {/* Desktop Links */}
      <ul className="hidden md:flex items-center gap-8 font-sans font-medium text-sm">
        {[
          { path: '/dashboard', label: 'Dashboard' },
          { path: '/auctions', label: 'Auctions' },
          { path: '/mint', label: 'Mint Asset' },
          { path: '/my-nfts', label: 'My Collection' },
        ].map((link) => (
          <li key={link.path}>
            <Link
              to={link.path}
              className={`relative py-1 cursor-pointer transition-colors duration-200 ${
                isActive(link.path) ? 'text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              {link.label}
              {isActive(link.path) && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand to-accent rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          </li>
        ))}
      </ul>

      {/* Wallet Action & Hamburger */}
      <div className="flex items-center gap-4">
        {account ? (
          <button
            onClick={disconnectWallet}
            className="flex items-center gap-2 px-4 py-2 bg-brand-subtle hover:bg-brand/20 border border-brand/30 rounded-xl text-xs font-semibold text-white transition-all duration-200 cursor-pointer hover:shadow-glow"
          >
            <div className="w-2 h-2 rounded-full bg-success animate-ping" />
            <span className="font-mono" data-test-id="connected-account-address">{truncateAddress(account)}</span>
            <LogOut className="w-3.5 h-3.5 text-text-secondary hover:text-white transition-colors" />
          </button>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            data-test-id="connect-wallet-button"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand-light border border-brand/30 hover:border-brand/50 rounded-xl text-xs font-semibold text-white shadow-glow transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
        )}

        <button
          className="md:hidden text-text-secondary hover:text-white cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Links Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 right-0 glass rounded-2xl p-6 border border-white/10 shadow-glow flex flex-col gap-4 z-40 md:hidden"
          >
            {[
              { path: '/dashboard', label: 'Dashboard' },
              { path: '/auctions', label: 'Auctions' },
              { path: '/mint', label: 'Mint Asset' },
              { path: '/my-nfts', label: 'My Collection' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`py-2 text-sm font-semibold border-b border-white/5 transition-colors duration-200 ${
                  isActive(link.path) ? 'text-brand' : 'text-text-secondary hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
