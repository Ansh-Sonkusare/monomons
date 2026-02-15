import { createWalletClient, createPublicClient, http, parseEther, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import TradingRoundManagerABI from '../contracts/TradingRoundManager.abi.json';

const MONAD_RPC = process.env.MONAD_RPC_URL || 'https://rpc.monad.xyz';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`;
const CONTRACT_ADDRESS = process.env.TRADING_CONTRACT_ADDRESS as Address;

export class ContractService {
  private account = privateKeyToAccount(ADMIN_PRIVATE_KEY);
  private walletClient = createWalletClient({
    account: this.account,
    transport: http(MONAD_RPC),
  });
  private publicClient = createPublicClient({
    transport: http(MONAD_RPC),
  });

  async createRound(roundData: {
    roundId: string;
    bettingEndTime: number;
    roundEndTime: number;
  }) {
    const tx = await this.executeWithRetry(async () => {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: TradingRoundManagerABI,
        functionName: 'createRound',
        args: [roundData.roundId, BigInt(roundData.bettingEndTime), BigInt(roundData.roundEndTime)],
      });
      return hash;
    });
    return tx;
  }

  async verifyUserDeposit(txHash: string, roundId: string, agentId: string, amount: string): Promise<boolean> {
    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
      return receipt.status === 'success';
    } catch (error) {
      console.error('Failed to verify user deposit:', error);
      return false;
    }
  }

  async lockBettingPhase(roundId: string) {
    return await this.executeWithRetry(async () => {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: TradingRoundManagerABI,
        functionName: 'lockBetting',
        args: [roundId],
      });
      return hash;
    });
  }

  async recordAgentTileBet(roundId: string, agentId: string, tileData: any, amount: string) {
    return await this.executeWithRetry(async () => {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: TradingRoundManagerABI,
        functionName: 'recordAgentBet',
        args: [roundId, parseInt(agentId), BigInt(amount)],
      });
      return hash;
    });
  }

  async settleRound(roundId: string, agentPnLs: string[]) {
    return await this.executeWithRetry(async () => {
      // Convert to int256[4] array
      const pnlArray = agentPnLs.map(pnl => BigInt(pnl));
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: TradingRoundManagerABI,
        functionName: 'settleRound',
        args: [roundId, pnlArray as [bigint, bigint, bigint, bigint]],
      });
      return hash;
    });
  }

  async claimWinningsForUser(roundId: string, userAddress: Address) {
    return await this.executeWithRetry(async () => {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: TradingRoundManagerABI,
        functionName: 'claimWinnings',
        args: [roundId, userAddress],
      });
      return hash;
    });
  }

  async cancelRound(roundId: string, reason: string) {
    return await this.executeWithRetry(async () => {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: TradingRoundManagerABI,
        functionName: 'cancelRound',
        args: [roundId],
      });
      return hash;
    });
  }

  async getAgentPoolBalance(roundId: string, agentId: string): Promise<bigint> {
    const balance = await this.publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: TradingRoundManagerABI,
      functionName: 'getAgentPool',
      args: [roundId, parseInt(agentId)],
    });
    return balance as bigint;
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        const result = await fn();
        // Wait for receipt
        if (typeof result === 'string') {
          const receipt = await this.publicClient.waitForTransactionReceipt({ hash: result as `0x${string}` });
          if (receipt.status === 'success') {
            return result;
          }
        }
        return result;
      } catch (error) {
        if (i === attempts - 1) throw error;
        const delay = 1000 * Math.pow(3, i); // 1s, 3s, 9s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('All retry attempts failed');
  }
}

export const contractService = new ContractService();
