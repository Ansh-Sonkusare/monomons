import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { logger } from '../utils/logger';

function Navbar() {
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
        logger.error('auth', 'Authentication failed', error);
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
    <nav className="fixed top-0 w-full h-16 z-50 bg-[#202028] border-b-4 border-black px-4 font-pixel flex items-center justify-center shadow-lg">
      <div className="w-full max-w-7xl flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 no-underline group">
          <div className="w-8 h-8 bg-red-600 border-2 border-white shadow-[2px_2px_0px_black] group-hover:translate-y-1 group-hover:shadow-none transition-all"></div>
          <span className="text-white text-lg tracking-widest text-shadow-sm group-hover:text-yellow-400">MONOMONS</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/spinner" className="text-white text-[10px] md:text-xs font-bold hover:text-yellow-400 tracking-wider">
            SPINNER
          </Link>
          {isAuthenticated ? (
            <>
              <div className="hidden md:block bg-black border border-gray-700 px-3 py-1 text-[8px] md:text-[10px] text-green-400 font-mono">
                ID: {address && shortenAddress(address)}
              </div>
              <button 
                onClick={handleDisconnect}
                className="bg-red-600 text-white text-[10px] py-2 px-4 border-2 border-white shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none hover:bg-red-500 transition-none"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <button 
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-blue-600 text-white text-[10px] py-2 px-4 border-2 border-white shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none hover:bg-blue-500 transition-none disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'LOADING...' : isConnected ? 'SIGN IN' : 'CONNECT WALLET'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
