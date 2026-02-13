import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { logger } from "../utils/logger";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("auth_token")
  );
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const isAuthenticated = !!token && isConnected;

  const login = async () => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    try {
      // Step 1: Get nonce from backend
      const nonceResponse = await fetch(`${API_URL}/api/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }

      const { nonce } = await nonceResponse.json();

      // Step 2: Sign the message
      const message = `Sign this message to authenticate with MonoMons.\n\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });

      // Step 3: Verify signature and get JWT
      const authResponse = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          message,
        }),
      });

      if (!authResponse.ok) {
        throw new Error("Authentication failed");
      }

      const { token: jwtToken } = await authResponse.json();

      // Store token in localStorage
      localStorage.setItem("auth_token", jwtToken);
      setToken(jwtToken);
    } catch (error) {
      logger.error('auth', 'Login error', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
  };

  // Clear token when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      logout();
    }
  }, [isConnected]);

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
