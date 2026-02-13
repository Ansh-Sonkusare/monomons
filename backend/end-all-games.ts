import { logger } from './src/utils/logger';

async function endGame() {
    const gameId = 'room-101-33';
    logger.info('cleanup', `Ending game: ${gameId}`);
    
    const { createPublicClient, createWalletClient, http, parseAbiItem, Hex, formatEther } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    
    const CONTRACT_ADDRESS = "0x16bb9B6712F0C38E48A52aec2D868cdfaa6470f1";
    const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY as Hex;
    
    if (!ADMIN_KEY) {
        throw new Error("ADMIN_PRIVATE_KEY not set");
    }
    
    const monadTestnet = {
        id: 10143,
        name: 'Monad Testnet',
        network: 'monad-testnet',
        nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
        rpcUrls: {
            default: { http: [process.env.RPC_URL || 'https://testnet-rpc.monad.xyz/'] },
            public: { http: [process.env.RPC_URL || 'https://testnet-rpc.monad.xyz/'] }
        }
    };
    
    const publicClient = createPublicClient({
        chain: monadTestnet as any,
        transport: http()
    });
    
    const walletClient = createWalletClient({
        chain: monadTestnet as any,
        transport: http(),
        account: privateKeyToAccount(ADMIN_KEY)
    });
    
    try {
        // Check if active
        const isActive = await publicClient.readContract({
            address: CONTRACT_ADDRESS as Hex,
            abi: [parseAbiItem("function isGameActive(string calldata gameId) external view returns (bool)")],
            functionName: 'isGameActive',
            args: [gameId]
        });
        
        if (!isActive) {
            logger.info('cleanup', `Game ${gameId} already ended`);
            process.exit(0);
        }
        
        // Check balance
        const balance = await publicClient.readContract({
            address: CONTRACT_ADDRESS as Hex,
            abi: [parseAbiItem("function getGameBalance(string calldata gameId) external view returns (uint256)")],
            functionName: 'getGameBalance',
            args: [gameId]
        }) as bigint;
        
        logger.info('cleanup', `Game ${gameId} has ${formatEther(balance)} MON`);
        
        // End game
        const { request } = await publicClient.simulateContract({
            address: CONTRACT_ADDRESS as Hex,
            abi: [parseAbiItem("function endGame(string calldata gameId) external")],
            functionName: 'endGame',
            args: [gameId],
            account: walletClient.account
        });
        
        const hash = await walletClient.writeContract(request);
        logger.info('cleanup', `Transaction: ${hash}`);
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
            logger.info('cleanup', `Game ${gameId} ended successfully`);
            
            const balanceAfter = await publicClient.readContract({
                address: CONTRACT_ADDRESS as Hex,
                abi: [parseAbiItem("function getGameBalance(string calldata gameId) external view returns (uint256)")],
                functionName: 'getGameBalance',
                args: [gameId]
            }) as bigint;
            logger.info('cleanup', `Balance after: ${formatEther(balanceAfter)} MON`);
        } else {
            logger.error('cleanup', 'Transaction failed');
        }
        
    } catch (error) {
        logger.error('cleanup', 'Error:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

endGame();
