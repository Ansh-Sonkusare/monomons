import { createPublicClient, createWalletClient, http, parseAbiItem, parseEther, formatEther, defineChain, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { db } from '../db';
import { bets, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Monad Testnet Configuration
const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.RPC_URL || 'https://testnet-rpc.monad.xyz/'] },
        public: { http: [process.env.RPC_URL || 'https://testnet-rpc.monad.xyz/'] }
    },
    testnet: true
});

const CONTRACT_ADDRESS = "0x16bb9B6712F0C38E48A52aec2D868cdfaa6470f1";
const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY as Hex;

const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http()
});

const walletClient = createWalletClient({
    chain: monadTestnet,
    transport: http(),
    account: ADMIN_KEY ? privateKeyToAccount(ADMIN_KEY) : undefined
});

const CONTRACT_ABI = [
    parseAbiItem("function deposit(string calldata gameId) external payable"),
    parseAbiItem("function withdrawFromGame(string calldata gameId, uint256 amount, address payable recipient) external"),
    parseAbiItem("function endGame(string calldata gameId) external"),
    parseAbiItem("function getGameBalance(string calldata gameId) external view returns (uint256)"),
    parseAbiItem("function getUserGameDeposit(string calldata gameId, address user) external view returns (uint256)"),
    parseAbiItem("function getTotalDeposits() external view returns (uint256)"),
    parseAbiItem("function isGameActive(string calldata gameId) external view returns (bool)")
];

export class BettingService {
    
    static async placeBet(userId: string, roomId: string, choice: 'playerA' | 'playerB', amount: string, txHash: string) {
        if (!process.env.DATABASE_URL) {
           console.warn("DB Validation skipped for betting (No DB setup)");
           return { success: true, mock: true };
        }

        try {
            console.log(`[DEPOSIT] Verifying bet tx: ${txHash} | Amount: ${amount} MON | Choice: ${choice} | Room: ${roomId}`);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as Hex });
            
            if (receipt.status !== 'success') {
                throw new Error("Transaction failed on-chain");
            }

            if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
                throw new Error(`Transaction recipient mismatch. Expected ${CONTRACT_ADDRESS}, got ${receipt.to}`);
            }

            let user = await db.query.users.findFirst({ where: eq(users.id, userId) });
            
            if (!user) {
                console.warn(`User ${userId} not found for bet.`);
                throw new Error("User not found");
            }

            const existing = await db.query.bets.findFirst({ where: eq(bets.txHash, txHash) });
            if (existing) {
                console.warn("[DEPOSIT] Duplicate bet attempt");
                return { success: true, duplicate: true };
            }

            await db.insert(bets).values({
                userId,
                userAddress: user.address,
                roomId,
                choice,
                amount,
                txHash,
                status: 'pending'
            });

            console.log(`[DEPOSIT] ✓ Bet recorded: ${amount} MON on ${choice} by ${user.address} in room ${roomId}`);
            console.log(`[DEPOSIT]   - Transaction: ${txHash}`);
            return { success: true };

        } catch (e) {
            console.error("Bet Verification Error:", e);
            throw e;
        }
    }

    static async distributeWinnings(roomId: string, winner: 'playerA' | 'playerB') {
        if (!process.env.DATABASE_URL || !ADMIN_KEY) {
            console.log("[WITHDRAWAL] Skipping payout (No DB or Admin Key)");
            return;
        }

        console.log(`[WITHDRAWAL] Starting payout distribution for Room ${roomId}...`);
        console.log(`[WITHDRAWAL] Winner: ${winner}`);
        
        // Check contract state BEFORE payout
        const gameBalanceBefore = await this.getGameBalance(roomId);
        console.log(`[WITHDRAWAL] Game pool balance BEFORE: ${gameBalanceBefore} MON`);
        
        // Debug: Show ALL bets for this room (not just pending)
        const allRoomBets = await db.query.bets.findMany({
            where: eq(bets.roomId, roomId)
        });
        console.log(`[WITHDRAWAL] DEBUG: Total bets in DB for room ${roomId}: ${allRoomBets.length}`);
        allRoomBets.forEach((b, i) => {
            console.log(`[WITHDRAWAL] DEBUG: Bet ${i + 1}: ${b.choice} | ${b.amount} | ${b.status} | ${b.userAddress}`);
        });
        
        const roomBets = await db.query.bets.findMany({
            where: and(eq(bets.roomId, roomId), eq(bets.status, 'pending'))
        });

        if (roomBets.length === 0) {
            console.log("[WITHDRAWAL] No pending bets found.");
            return;
        }

        const winners = roomBets.filter(b => b.choice === winner);
        const losers = roomBets.filter(b => b.choice !== winner);

        const totalPool = roomBets.reduce((acc, b) => acc + BigInt(b.amount), 0n);
        const loserPool = losers.reduce((acc, b) => acc + BigInt(b.amount), 0n);
        const winnerPool = winners.reduce((acc, b) => acc + BigInt(b.amount), 0n);

        console.log(`[WITHDRAWAL] Total Pool: ${formatEther(totalPool)} MON | Winners: ${winners.length} | Losers: ${losers.length}`);
        console.log(`[WITHDRAWAL] Winner Pool: ${formatEther(winnerPool)} MON | Loser Pool: ${formatEther(loserPool)} MON`);
        
        let totalPaidOut = 0n;
        const payoutTxHashes: string[] = [];

        // Process Winners - pay principal + profit from the game pool
        for (const w of winners) {
            const principal = BigInt(w.amount);
            const shareOfProfit = winnerPool > 0n ? (principal * loserPool) / winnerPool : 0n;
            const totalPayout = principal + shareOfProfit;
            
            console.log(`[WITHDRAWAL] Processing Winner: ${w.userAddress}`);
            console.log(`[WITHDRAWAL]   - Bet: ${formatEther(principal)} MON | Profit: ${formatEther(shareOfProfit)} MON | Total: ${formatEther(totalPayout)} MON`);

            try {
                const txHash = await this.withdrawFromGame(roomId, totalPayout, w.userAddress);
                payoutTxHashes.push(txHash);
                totalPaidOut += totalPayout;

                await db.update(bets).set({ 
                    status: 'won',
                    payoutTxHash: txHash
                }).where(eq(bets.id, w.id));
                
                console.log(`[WITHDRAWAL] ✓ Paid ${w.userAddress}: ${formatEther(totalPayout)} MON (tx: ${txHash})`);

            } catch (e) {
                console.error(`[WITHDRAWAL] ✗ Failed to payout winner ${w.userAddress}:`, e);
            }
        }

        // Mark losers
        for (const l of losers) {
            await db.update(bets).set({ status: 'lost' }).where(eq(bets.id, l.id));
            console.log(`[WITHDRAWAL] ✗ Loser marked: ${l.userAddress} lost ${formatEther(BigInt(l.amount))} MON`);
        }
        
        console.log(`[WITHDRAWAL] Total paid out: ${formatEther(totalPaidOut)} MON`);
        
        // End game - remaining goes to admin
        try {
            console.log(`[WITHDRAWAL] Ending game ${roomId} - remaining funds go to admin...`);
            const endGameTx = await this.endGame(roomId);
            console.log(`[WITHDRAWAL] ✓ Game ended (tx: ${endGameTx})`);
        } catch (e) {
            console.error(`[WITHDRAWAL] ✗ Failed to end game:`, e);
        }
        
        // Check contract state AFTER
        const gameBalanceAfter = await this.getGameBalance(roomId);
        console.log(`[WITHDRAWAL] Game pool balance AFTER: ${gameBalanceAfter} MON (should be 0)`);
        
        console.log(`[WITHDRAWAL] Payout distribution complete for Room ${roomId}`);
    }

    static async getGameBalance(gameId: string): Promise<string> {
        try {
            const balance = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'getGameBalance',
                args: [gameId]
            }) as bigint;
            
            return formatEther(balance);
        } catch (e) {
            console.error("Failed to fetch game balance:", e);
            return "0";
        }
    }

    static async getTotalDeposits(): Promise<string> {
        try {
            const total = await publicClient.readContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'getTotalDeposits'
            }) as bigint;
            
            return formatEther(total);
        } catch (e) {
            console.error("Failed to fetch total deposits:", e);
            throw e;
        }
    }

    private static async withdrawFromGame(gameId: string, amount: bigint, recipient: string): Promise<string> {
        if (!walletClient.account) throw new Error("Admin wallet not configured");
        
        console.log(`[CONTRACT] withdrawFromGame: Game ${gameId} -> ${formatEther(amount)} MON -> ${recipient}`);
        
        try {
            const { request } = await publicClient.simulateContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'withdrawFromGame',
                args: [gameId, amount, recipient as Hex],
                account: walletClient.account
            });
            
            console.log(`[CONTRACT] Simulation successful, executing transaction...`);
            const hash = await walletClient.writeContract(request);
            console.log(`[CONTRACT] Transaction submitted: ${hash}`);
            
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            
            if (receipt.status === 'success') {
                console.log(`[CONTRACT] ✓ Transaction confirmed: ${hash}`);
            } else {
                console.error(`[CONTRACT] ✗ Transaction failed: ${hash}`);
                throw new Error(`Transaction failed: ${hash}`);
            }
            
            return hash;
        } catch (error) {
            console.error(`[CONTRACT] ✗ Withdrawal failed:`, error);
            throw error;
        }
    }

    private static async endGame(gameId: string): Promise<string> {
        if (!walletClient.account) throw new Error("Admin wallet not configured");
        
        console.log(`[CONTRACT] endGame: Game ${gameId}`);
        
        try {
            const { request } = await publicClient.simulateContract({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'endGame',
                args: [gameId],
                account: walletClient.account
            });
            
            console.log(`[CONTRACT] Simulation successful, executing transaction...`);
            const hash = await walletClient.writeContract(request);
            console.log(`[CONTRACT] Transaction submitted: ${hash}`);
            
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            
            if (receipt.status === 'success') {
                console.log(`[CONTRACT] ✓ Game ended: ${hash}`);
            } else {
                console.error(`[CONTRACT] ✗ Failed to end game: ${hash}`);
                throw new Error(`Transaction failed: ${hash}`);
            }
            
            return hash;
        } catch (error) {
            console.error(`[CONTRACT] ✗ endGame failed:`, error);
            throw error;
        }
    }
}
