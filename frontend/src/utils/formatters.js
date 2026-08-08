import { formatEther, parseEther } from 'ethers';

export function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(weiValue) {
  if (!weiValue && weiValue !== 0n) return '0 ETH';
  const formatted = parseFloat(formatEther(weiValue)).toFixed(4);
  return `${formatted} ETH`;
}

export function formatTimeRemaining(endTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTimestamp);
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function getTimeUrgency(endTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(endTimestamp) - now;
  if (diff <= 0) return 'ended';
  if (diff < 600) return 'critical';   // < 10 min
  if (diff < 3600) return 'urgent';    // < 1 hour
  return 'normal';
}

export function formatDate(timestamp) {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseTokenURI(tokenURI) {
  if (!tokenURI) return null;
  try {
    if (tokenURI.startsWith('data:application/json;base64,')) {
      const base64Str = tokenURI.split('data:application/json;base64,')[1];
      const jsonStr = atob(base64Str);
      return JSON.parse(jsonStr);
    }
    if (tokenURI.startsWith('{')) {
      return JSON.parse(tokenURI);
    }
  } catch (err) {
    console.error('Failed to parse tokenURI:', err);
  }
  return null;
}

export function parseEthToWei(ethString) {
  try {
    return parseEther(ethString);
  } catch {
    return null;
  }
}

export function generateGradient(tokenId) {
  const id = Number(tokenId);
  // Elegant, high-end metallic/charcoal/bronze gradients for premium assets
  const palettes = [
    ['#1e1c19', '#0d0c0b'], // Warm Brushed Gold to Deep Obsidian
    ['#25211c', '#09090a'], // Champagne Gold Hue to Charcoal Black
    ['#16181b', '#070809'], // Polished Dark Steel to Deep Jet Black
    ['#28221b', '#0a0908'], // Warm Bronze to Obsidian
    ['#1d1f1d', '#080908'], // Muted Olive/Sage Tint to Black
    ['#241e1e', '#0c0a0a']  // Subtle Mahogany Slate to Deep Black
  ];
  const [color1, color2] = palettes[id % palettes.length];
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}
export function formatErrorMessage(error) {
  if (!error) return 'Transaction failed. Please try again.';
  
  // Handle string errors
  if (typeof error === 'string') {
    if (error.includes('insufficient funds')) {
      return 'Insufficient ETH balance in your wallet for value + gas fees.';
    }
    if (error.includes('user rejected') || error.includes('User denied')) {
      return 'Transaction cancelled by user.';
    }
    return error.split('(transaction=')[0].split('(action=')[0].trim();
  }

  // Handle Ethers.js error codes
  if (error.code === 'INSUFFICIENT_FUNDS' || (error.message && error.message.includes('insufficient funds'))) {
    return 'Insufficient ETH balance in your wallet to cover the asset price and gas fees.';
  }

  if (error.code === 'ACTION_REJECTED' || (error.message && (error.message.includes('user rejected') || error.message.includes('User denied')))) {
    return 'Transaction cancelled by user.';
  }

  // Extract explicit contract revert reason
  if (error.reason) {
    return `Transaction reverted: ${error.reason}`;
  }

  if (error.shortMessage) {
    return error.shortMessage;
  }

  if (error.info?.error?.message) {
    const msg = error.info.error.message;
    if (msg.includes('insufficient funds')) {
      return 'Insufficient ETH balance in your wallet to cover the asset price and gas fees.';
    }
    if (msg.includes('execution reverted:')) {
      return `Contract reverted: ${msg.split('execution reverted:')[1].trim()}`;
    }
    return msg;
  }

  if (error.message) {
    let clean = error.message.split('(transaction=')[0].split('(action=')[0].split('(code=')[0].trim();
    if (clean.includes('insufficient funds')) {
      return 'Insufficient ETH balance in wallet for value + gas.';
    }
    return clean || 'Transaction failed. Please check network and wallet status.';
  }

  return 'Transaction failed. Please try again.';
}
