import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuctionExplorer from './pages/AuctionExplorer';
import AuctionDetail from './pages/AuctionDetail';
import MintPage from './pages/MintPage';
import MyNFTs from './pages/MyNFTs';
import CreateAuction from './pages/CreateAuction';

function Layout() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen pb-12">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
          },
          success: {
            iconTheme: { primary: 'var(--success)', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: 'var(--error)', secondary: 'white' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auctions" element={<AuctionExplorer />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/mint" element={<MintPage />} />
          <Route path="/my-nfts" element={<MyNFTs />} />
          <Route path="/create-auction/:tokenId" element={<CreateAuction />} />
        </Route>
      </Routes>
    </>
  );
}
