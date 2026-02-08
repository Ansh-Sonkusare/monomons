import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { http } from "wagmi";
import { monad } from "@reown/appkit/networks";

export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "";

if (!projectId) {
  console.warn("VITE_REOWN_PROJECT_ID is not set");
}

export const wagmiAdapter = new WagmiAdapter({
  networks: [monad],
  transports: {
    [monad.id]: http(),
  },
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;
