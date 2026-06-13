import { create } from 'zustand';
import { BrowserProvider } from 'ethers';

export const useWalletStore = create((set, get) => ({
  account: null,
  provider: null,
  signer: null,
  chainId: null,
  isConnecting: false,
  error: null,

  connectWallet: async () => {
    if (!window.ethereum) {
      set({ error: 'MetaMask not found. Please install MetaMask.' });
      return;
    }
    set({ isConnecting: true, error: null });
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      set({
        account: accounts[0],
        provider,
        signer,
        chainId: Number(network.chainId),
        isConnecting: false,
      });

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          get().disconnectWallet();
        } else {
          set({ account: accounts[0] });
          provider.getSigner().then((signer) => set({ signer }));
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    } catch (error) {
      set({ error: error.message, isConnecting: false });
    }
  },

  disconnectWallet: () => {
    set({ account: null, provider: null, signer: null, chainId: null, error: null });
  },
}));
