import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GameWebSocket, type ChatMessage, type BattleState } from '../services/GameWebSocket';
import { BattleScene } from '../components/BattleComponents';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { parseEther, parseAbi, formatEther } from 'viem';
import { api } from '../lib/utils';
import { logger } from '../utils/logger';

// Mock colors for avatars
const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

type DojoPlayer = {
    id: string;
    name: string;
    color: string;
};

const CONTRACT_ADDRESS = "0x16bb9B6712F0C38E48A52aec2D868cdfaa6470f1";
const CONTRACT_ABI = parseAbi([
    "function deposit(string calldata gameId) external payable",
    "function getGameBalance(string calldata gameId) external view returns (uint256)",
    "function getTotalDeposits() external view returns (uint256)",
    "function isGameActive(string calldata gameId) external view returns (bool)"
]);

function DojoPage() {
    const { dojoName, roomId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { isConnected } = useAccount();
    const wsRef = useRef<GameWebSocket | null>(null);
    
    // Betting State
    const { writeContractAsync, isPending: isBetting } = useWriteContract();
    const [betTxHash, setBetTxHash] = useState<string | null>(null);
    const { isSuccess: isBetConfirmed } = useWaitForTransactionReceipt({ hash: betTxHash as `0x${string}` });

    const [players, setPlayers] = useState<DojoPlayer[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [battleState, setBattleState] = useState<BattleState | null>(null);
    const [totalPool, setTotalPool] = useState<string>('0');
    const [bettingCountdown, setBettingCountdown] = useState<number>(0);

    // Track active bet attempt to sync with backend after confirmation
    const [pendingBetChoice, setPendingBetChoice] = useState<'playerA' | 'playerB' | null>(null);
    const [pendingBetAmount, setPendingBetAmount] = useState<string | null>(null);

    // Betting countdown timer
    useEffect(() => {
        if (battleState?.phase === 'betting' && battleState?.bettingEndTime) {
            const endTime = battleState.bettingEndTime;
            const interval = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
                setBettingCountdown(remaining);
                if (remaining === 0) {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setBettingCountdown(0);
        }
    }, [battleState]);

    useEffect(() => {
        if (isBetConfirmed && betTxHash && pendingBetChoice && roomId && token && pendingBetAmount) {
            logger.info('dojo', 'Bet confirmed on-chain! Notifying backend...');
            
            api.placeBet(roomId, pendingBetChoice, pendingBetAmount, betTxHash, token)
            .then(data => {
                logger.info('dojo', 'Backend confirmed bet', data);
                if (data.success) {
                    alert(`Bet placed on ${pendingBetChoice === 'playerA' ? 'Red' : 'Blue'}!`);
                    // Pool balance auto-refreshes via useReadContract hook
                } else {
                    alert(`Bet failed: ${data.error}`);
                }
                setPendingBetChoice(null);
                setPendingBetAmount(null);
                setBetTxHash(null);
            })
            .catch(err => {
                logger.error('dojo', 'Failed to notify backend of bet', err);
                alert("Failed to register bet with backend");
            });
        }
    }, [isBetConfirmed, betTxHash, pendingBetChoice, roomId, token, pendingBetAmount]);

    // Read game balance directly from contract
    const { data: gameBalance } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getGameBalance',
        args: roomId ? [roomId] : undefined,
        query: {
            enabled: !!roomId,
            refetchInterval: 5000 // Refetch every 5 seconds
        }
    });

    // Update totalPool when gameBalance changes
    useEffect(() => {
        if (gameBalance !== undefined) {
            setTotalPool(formatEther(gameBalance));
        }
    }, [gameBalance]);



    const handlePlaceBet = async (choice: 'playerA' | 'playerB') => {
        if (!isConnected) {
            alert("Please connect your wallet first!");
            return;
        }

        if (!roomId) {
            alert("Room ID not available!");
            return;
        }

        const amount = prompt("Enter bet amount in MON:", "0.1");
        if (!amount || isNaN(Number(amount))) return;

        try {
            const weiAmount = parseEther(amount);
            const hash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: CONTRACT_ABI,
                functionName: 'deposit',
                args: [roomId],
                value: weiAmount
            });
            
            logger.info('dojo', `Bet Tx Sent: ${hash}`);
            setBetTxHash(hash);
            setPendingBetChoice(choice);
            setPendingBetAmount(weiAmount.toString());

        } catch (e) {
            logger.error('dojo', 'Betting failed', e);
            alert("Failed to place bet. Check console.");
        }
    };

    useEffect(() => {
        if (!token || !roomId) return;

        logger.info('dojo', 'Connecting to Dojo WS...');
        const ws = new GameWebSocket(token);
        wsRef.current = ws;
        
        ws.connect();
        
        ws.onAuth((player) => {
            logger.info('dojo', `Authenticated as: ${player.id}`);
        });

        // Auto join room on successful auth
        ws.joinRoom(roomId); 

        ws.onBattleUpdate((state) => {
            setBattleState(state);
        });

        ws.onRoomEvent({
            onState: (roomPlayers) => {
                setPlayers(roomPlayers.map((p) => ({
                    id: p.id,
                    name: p.username || p.address.slice(0, 8),
                    color: AVATAR_COLORS[p.id.charCodeAt(0) % AVATAR_COLORS.length]
                })));
            },
            onJoin: (p) => {
                setPlayers(prev => {
                    if (prev.find(existing => existing.id === p.id)) return prev;
                    return [...prev, {
                        id: p.id,
                        name: p.username || p.address.slice(0, 8),
                        color: AVATAR_COLORS[p.id.charCodeAt(0) % AVATAR_COLORS.length]
                    }];
                });
            },
            onLeave: (playerId) => {
                setPlayers(prev => prev.filter(p => p.id !== playerId));
            },
            onMessage: (message) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
        });

        return () => {
            ws.disconnect();
        };
    }, [token, roomId]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !wsRef.current || !roomId) return;
        
        wsRef.current.sendChatMessage(roomId, inputMessage);
        setInputMessage('');
    };




    return (
        <div className="flex w-full h-screen bg-[#111] overflow-hidden text-white font-pixel">
            {/* Left Partition: Battle Arena */}
            <div className="flex-1 flex flex-col border-r-4 border-white relative bg-[#111]">
                <div className="absolute top-4 left-4 z-50 bg-black border-2 border-white p-2 shadow-[4px_4px_0px_white] flex items-center gap-4">
                    <div>
                        <h1 className="text-sm font-bold text-white uppercase tracking-widest">
                            {dojoName?.replace(/-/g, ' ')}
                        </h1>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">ROOM ID: {roomId}</p>
                    </div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="bg-red-600 text-white text-[10px] px-3 py-2 border-2 border-white shadow-[2px_2px_0px_black] active:translate-y-1 active:shadow-none hover:bg-red-500 font-bold uppercase transition-none cursor-pointer"
                    >
                        ◀ EXIT
                    </button>
                </div>
                
                <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                    {battleState ? (
                        <BattleScene state={battleState} />
                    ) : (
                        <div className="text-center p-8 border-4 border-dashed border-gray-600 bg-black/20">
                            <p className="text-gray-400 text-xs font-bold animate-pulse">CONNECTING TO SERVER...</p>
                        </div>
                    )}
                </div>

                {/* Betting Bar (Retro RPG Menu Style) */}
                <div className="h-36 border-t-4 border-white bg-[#1a1a1a] p-4 flex items-center justify-between gap-4 shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)]">
                    
                    {/* Player A Betting Card */}
                    <div className="flex-1 bg-[#222] border-2 border-white p-3 shadow-[4px_4px_0px_black] flex justify-between items-center group hover:bg-[#333] cursor-pointer transition-colors"
                         onClick={() => !isBetting && battleState?.phase === 'betting' && handlePlaceBet('playerA')}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-700 border-2 border-white flex items-center justify-center text-white font-bold text-lg shadow-[2px_2px_0px_black]">A</div>
                            <div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{battleState ? battleState.playerA.name : 'PLAYER A'}</h3>
                                <div className="text-[10px] text-red-400 font-bold mt-1">
                                    {battleState?.phase === 'betting' ? '▶ BET OPEN' : 'LOCKED'}
                                </div>
                            </div>
                        </div>
                        <button 
                            disabled={isBetting || battleState?.phase !== 'betting'}
                            className="bg-red-600 text-white text-[10px] px-4 py-2 border-2 border-white shadow-[2px_2px_0px_black] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500"
                        >
                            {isBetting && pendingBetChoice === 'playerA' ? '...' : 'BET RED'}
                        </button>
                    </div>

                    {/* Center Info Panel */}
                    <div className="flex flex-col items-center min-w-[160px] bg-black border-4 border-double border-white p-3 mx-2">
                         <div className="text-[10px] text-yellow-400 uppercase mb-1 text-center font-bold">Prize Pool</div>
                         <div className="text-xl text-white font-bold tracking-widest text-shadow-sm">{totalPool}</div>
                         <div className="text-[8px] text-gray-400 uppercase mt-1">MON</div>
                         
                         {battleState?.phase === 'betting' && (
                             <div className="mt-2 text-xs text-green-400 animate-pulse border px-2 border-green-400">
                                 TIME: {bettingCountdown}
                             </div>
                         )}
                    </div>

                    {/* Player B Betting Card */}
                    <div className="flex-1 bg-[#222] border-2 border-white p-3 shadow-[4px_4px_0px_black] flex justify-between items-center group hover:bg-[#333] cursor-pointer transition-colors"
                         onClick={() => !isBetting && battleState?.phase === 'betting' && handlePlaceBet('playerB')}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-700 border-2 border-white flex items-center justify-center text-white font-bold text-lg shadow-[2px_2px_0px_black]">B</div>
                            <div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{battleState ? battleState.playerB.name : 'PLAYER B'}</h3>
                                <div className="text-[10px] text-blue-400 font-bold mt-1">
                                    {battleState?.phase === 'betting' ? '▶ BET OPEN' : 'LOCKED'}
                                </div>
                            </div>
                        </div>
                        <button 
                            disabled={isBetting || battleState?.phase !== 'betting'}
                            className="bg-blue-600 text-white text-[10px] px-4 py-2 border-2 border-white shadow-[2px_2px_0px_black] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500"
                        >
                            {isBetting && pendingBetChoice === 'playerB' ? '...' : 'BET BLUE'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Partition: Lobby & Chat */}
            <div className="w-96 flex flex-col bg-[#0a0a0a] border-l-4 border-white">
                
                {/* Players List */}
                <div className="h-1/3 border-b-4 border-white p-4 bg-[#111]">
                    <h2 className="text-xs font-bold text-white uppercase mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                        <span className="w-2 h-2 bg-green-500 inline-block animate-pulse"/> 
                        ONLINE PLAYERS ({players.length})
                    </h2>
                    
                    <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-1">
                        {players.map((player) => (
                            <div 
                                key={player.id} 
                                className="aspect-square flex flex-col items-center justify-center bg-[#222] border border-gray-600 hover:border-white cursor-help group relative shadow-sm"
                                title={player.name}
                            >
                                <div 
                                    className="w-8 h-8 mb-1 border border-black"
                                    style={{ backgroundColor: player.color }}
                                />
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 border border-white hidden group-hover:block z-50 whitespace-nowrap shadow-lg">
                                    {player.name}
                                </div>
                            </div>
                        ))}
                        {[...Array(Math.max(0, 8 - players.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square border border-dashed border-gray-800 opacity-30 flex items-center justify-center text-gray-500 text-[8px]">+</div>
                        ))}
                    </div>
                </div>

                {/* Retro Chat */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#000]">
                    <div className="p-2 border-b border-gray-800 bg-[#111] flex justify-between items-center">
                        <h2 className="text-[10px] font-bold text-gray-300 uppercase tracking-wider pl-2">
                            ROOM CHAT
                        </h2>
                        <div className="flex gap-1 pr-2">
                            <div className="w-1.5 h-1.5 bg-gray-500"/>
                            <div className="w-1.5 h-1.5 bg-gray-500"/>
                            <div className="w-1.5 h-1.5 bg-gray-500"/>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs bg-[#050505]">
                        {messages.length === 0 ? (
                            <div className="text-gray-600 italic text-[10px] text-center mt-10">
                                -- START OF TRANSMISSION --
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className="flex flex-col gap-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`font-bold ${msg.senderId === '1' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                            {msg.senderName}
                                        </span>
                                        <span className="text-[8px] text-gray-700">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-[11px] leading-tight pl-2 border-l-2 border-gray-800 ml-1">
                                        {msg.text}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 bg-[#111] border-t border-gray-800">
                        <div className="flex gap-2 items-center bg-[#222] border border-gray-600 p-1">
                            <span className="text-gray-400 text-xs pl-1">{'>'}</span>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="w-full bg-transparent text-white text-xs font-mono focus:outline-none placeholder-gray-600"
                                placeholder="Say something..."
                                spellCheck={false}
                            />
                            <button type="submit" className="text-[8px] bg-gray-700 text-white px-2 py-1 uppercase hover:bg-gray-600">SEND</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default DojoPage;
