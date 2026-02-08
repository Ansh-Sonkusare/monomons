import { useAuth } from '../contexts/AuthContext';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

function DashboardNavbar() {
  const { isAuthenticated, login, logout, isLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const handleConnect = async () => {
    if (!isConnected) {
      await open();
    } else if (isConnected && !isAuthenticated) {
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
    <nav className="fixed top-0 w-full h-1 z-50 flex items-start justify-end">
      <div className="bg-black/30 backdrop-blur-md border border-white/20 px-3 py-2 shadow-lg">
        <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <span className="text-white/90 text-sm font-medium">
              {address && shortenAddress(address)}
            </span>
            <button 
              onClick={handleDisconnect}
              className="bg-red-600/90 text-white py-1 px-2 text-sm cursor-pointer font-semibold transition-all duration-300 hover:bg-red-700 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] border border-red-600/50"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button 
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-white text-black py-2 px-5 text-sm rounded-md cursor-pointer font-semibold transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] border border-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing...' : isConnected ? 'Sign In' : 'Connect Wallet'}
          </button>
        )}
      </div>
      </div>
    </nav>
  );
}

export default DashboardNavbar;
