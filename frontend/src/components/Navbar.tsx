import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

function Navbar() {
  const { isAuthenticated, login, logout, isLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const handleConnect = async () => {
    if (!isConnected) {
      // Open wallet connection modal
      await open();
    } else if (isConnected && !isAuthenticated) {
      // Connected but not authenticated, sign message
      try {
        await login();
      } catch (error) {
        console.error('Authentication failed:', error);
      }
    }
  };

  const handleDisconnect = () => {
    logout();
    disconnect();
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 w-full h-20 z-50 transition-all duration-300 bg-black/50 backdrop-blur-md border-b border-white/10 flex items-center justify-center px-4">
      <div className="w-full max-w-7xl flex justify-between items-center h-full">
        <Link to="/" className="flex items-center gap-2 no-underline text-white font-bold text-2xl">
          <span className="font-space tracking-wider">Monomons</span>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-white/70 text-sm">
                {address && shortenAddress(address)}
              </span>
              <button 
                onClick={handleDisconnect}
                className="bg-red-600 text-white py-1 px-5 text-sm rounded-none cursor-pointer font-bold transition-all duration-300 hover:bg-red-700 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-600 uppercase tracking-wider"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button 
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-white text-black py-5 px-10 text-sm rounded-none cursor-pointer font-bold transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing...' : isConnected ? 'Sign In' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
