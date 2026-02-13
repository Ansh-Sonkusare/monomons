import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import { defineChain } from "@reown/appkit/networks";
import { logger } from "../utils/logger";

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "";

if (!projectId) {
  logger.warn('config', 'VITE_REOWN_PROJECT_ID is not set');
}

// Define Monad Testnet manually to ensure correct connection
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com/' },
  },
  testnet: true,
} as any);

export const wagmiAdapter = new WagmiAdapter({
  networks: [monadTestnet as any],
  transports: {
    [monadTestnet.id]: http(),
  },
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;
