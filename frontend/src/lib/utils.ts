import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Contract configuration for client-side reads
const CONTRACT_ADDRESS = "0x16bb9B6712F0C38E48A52aec2D868cdfaa6470f1";

export const api = {
  async placeBet(roomId: string, choice: 'playerA' | 'playerB', amount: string, txHash: string, token: string) {
    const response = await fetch(`${API_BASE}/api/bets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roomId, choice, amount, txHash })
    });
    return response.json();
  },
  async getTotalPool() {
    const response = await fetch(`${API_BASE}/api/bets/total`);
    return response.json();
  },
  async getGamePoolBalance(roomId: string) {
    const response = await fetch(`${API_BASE}/api/bets/pool/${roomId}`);
    return response.json();
  }
};

export { CONTRACT_ADDRESS };
