import { useState, useEffect, useRef } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BettingGrid } from './taptrading/BettingGrid';

interface PricePoint {
  time: string;
  price: number;
}

interface Agent {
  id: string;
  name: string;
  strategyType: string;
  avatarColor: string;
  poolSize: string;
}

interface AgentBet {
  agentId: string;
  agentColor: string;
  agentName: string;
  colIndex: number;
  rowIndex: number;
  amount: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/trading';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function TapTrading() {
  const { user } = useAuth();
  const binanceWsRef = useRef<WebSocket | null>(null);
  const tradingWsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Price data from Binance
  const [currentPrice, setCurrentPrice] = useState<number>(95000);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Trading state from backend
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentPools, setAgentPools] = useState<Map<string, string>>(new Map());
  const [agentBets, setAgentBets] = useState<AgentBet[]>([]);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [tradingWsConnected, setTradingWsConnected] = useState(false);

  // Connect to Binance WebSocket for price data
  useEffect(() => {
    const connectBinance = () => {
      try {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
        binanceWsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ Connected to Binance WebSocket');
          setConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const price = parseFloat(data.c);
            
            if (!isNaN(price) && price > 0) {
              setCurrentPrice(price);
              setPriceHistory(prev => {
                const now = new Date().toISOString();
                const newPoint = { time: now, price };
                const updated = [...prev, newPoint];
                return updated.slice(-300);
              });
            }
          } catch (error) {
            console.error('Error parsing Binance message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('Binance WebSocket error:', error);
          setConnectionStatus('disconnected');
        };

        ws.onclose = () => {
          console.log('Binance WebSocket closed, reconnecting in 3s...');
          setConnectionStatus('disconnected');
          reconnectTimeoutRef.current = setTimeout(connectBinance, 3000);
        };
      } catch (error) {
        console.error('Error connecting to Binance:', error);
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connectBinance, 3000);
      }
    };

    connectBinance();

    return () => {
      if (binanceWsRef.current) binanceWsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // Connect to backend trading WebSocket for agent bets
  useEffect(() => {
    console.log('🚀 Trading WebSocket effect starting...');
    console.log('WS_URL:', WS_URL);
    console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
    
    let reconnectTrading: NodeJS.Timeout;
    
    const connectTradingWs = () => {
      console.log('🔗 Connecting to trading WebSocket:', WS_URL);
      const ws = new WebSocket(WS_URL);
      tradingWsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to trading WebSocket');
        setTradingWsConnected(true);
        
        // Subscribe to current round if exists
        if (currentRound) {
          ws.send(JSON.stringify({ action: 'subscribe', roundId: currentRound.id }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Trading WS message:', message.event, message.data);
          
          switch (message.event) {
            case 'round_started':
              setCurrentRound({
                id: message.data.roundId,
                roundNumber: message.data.roundNumber,
                status: 'BETTING',
              });
              setAgentBets([]); // Clear bets on new round
              ws.send(JSON.stringify({ action: 'subscribe', roundId: message.data.roundId }));
              break;

            case 'agent_bet_placed':
              console.log('🤖 Agent bet placed:', message.data);
              const agent = agents.find(a => a.id === message.data.agentId);
              if (agent) {
                const newBet: AgentBet = {
                  agentId: message.data.agentId,
                  agentColor: agent.avatarColor,
                  agentName: agent.name,
                  colIndex: message.data.tileCol,
                  rowIndex: message.data.tileRow,
                  amount: parseFloat(message.data.amount) / 1e18, // Convert from wei
                  multiplier: message.data.multiplier,
                  status: 'pending',
                };
                setAgentBets(prev => [...prev, newBet]);
              }
              break;

            case 'agent_bet_resolved':
              setAgentBets(prev => prev.map(bet => 
                bet.agentId === message.data.agentId && 
                bet.colIndex === message.data.tileCol &&
                bet.rowIndex === message.data.tileRow
                  ? { ...bet, status: message.data.won ? 'won' : 'lost' }
                  : bet
              ));
              break;

            case 'agent_pool_update':
              setAgentPools(prev => new Map(prev).set(message.data.agentId, message.data.newPoolSize));
              break;

            case 'trading_started':
              if (message.data.agentPools) {
                const pools = new Map();
                message.data.agentPools.forEach((pool: any) => {
                  pools.set(pool.agentId, pool.poolSize);
                });
                setAgentPools(pools);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing trading message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Trading WebSocket error:', error);
        console.log('WebSocket URL:', WS_URL);
        console.log('WebSocket state:', ws.readyState);
        console.log('WebSocket URL being used:', ws.url);
      };

      ws.onclose = (event) => {
        console.log('🔌 Trading WebSocket closed');
        console.log('Close code:', event.code);
        console.log('Close reason:', event.reason);
        console.log('Was clean:', event.wasClean);
        setTradingWsConnected(false);
        reconnectTrading = setTimeout(connectTradingWs, 3000);
      };
    };

    connectTradingWs();

    return () => {
      clearTimeout(reconnectTrading);
      if (tradingWsRef.current) tradingWsRef.current.close();
    };
  }, [agents, currentRound]);

  // Fetch agents and current round
  useEffect(() => {
    // Fetch agents
    fetch(`${API_URL}/api/trading/agents`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAgents(data.agents);
        }
      })
      .catch(err => console.error('Error fetching agents:', err));

    // Fetch current round
    fetch(`${API_URL}/api/trading/rounds/current`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.round) {
          setCurrentRound(data.round);
        }
      })
      .catch(err => console.error('Error fetching round:', err));
  }, []);

  // Mock price generator if Binance fails
  useEffect(() => {
    if (connectionStatus === 'disconnected' && priceHistory.length === 0) {
      const interval = setInterval(() => {
        const volatility = 0.0002;
        const change = (Math.random() - 0.5) * 2 * volatility;
        
        setCurrentPrice(prev => {
          const newPrice = prev * (1 + change);
          const now = new Date().toISOString();
          
          setPriceHistory(ph => {
            const updated = [...ph, { time: now, price: newPrice }];
            return updated.slice(-300);
          });
          
          return newPrice;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [connectionStatus, priceHistory.length]);

  const handleBetOnAgent = async (agentId: string) => {
    if (!user) return;
    console.log(`Betting on agent ${agentId}`);
    alert(`Betting on agent ${agentId} - Wallet integration needed`);
  };

  const formatPool = (poolSize: string) => {
    if (!poolSize || poolSize === '0') return '0.00';
    return (parseInt(poolSize) / 1e18).toFixed(4);
  };

  return (
    <div className="flex w-full h-screen bg-[#0a0a0a] overflow-hidden text-white font-space">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative pt-16">
        
        {/* Header with BTC Price */}
        <div className="bg-[#161616] border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                {currentRound ? `Round #${currentRound.roundNumber}` : 'AI Trading Arena'}
              </h1>
              {currentRound && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/50">
                  LIVE
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  tradingWsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`} />
                <span className="text-sm text-gray-400">
                  {tradingWsConnected ? 'Trading Connected' : 'Trading Disconnected'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-400 animate-pulse' 
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
                }`} />
                <span className="text-sm text-gray-400">
                  {connectionStatus === 'connected' 
                    ? 'Price Live' 
                    : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 flex items-center gap-2 text-lg">
            <TrendingUp size={18} className="text-blue-400" />
            <span className="text-gray-400">BTC Price:</span>
            <span className="font-mono font-bold text-white">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          {/* Agent Bets Counter */}
          {agentBets.length > 0 && (
            <div className="mt-2 text-sm text-gray-400">
              🤖 Active Agent Bets: {agentBets.filter(b => b.status === 'pending').length}
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Betting Grid */}
          <div className="flex-1 relative border-r border-gray-800">
            <BettingGrid
              currentPrice={currentPrice}
              balance={1000}
              onBetResult={() => {}}
              priceHistory={priceHistory}
              agentBets={agentBets}
            />
          </div>

          {/* Right Panel - Agent Cards */}
          <div className="w-80 bg-[#161616] border-l border-gray-800 overflow-y-auto">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Trophy size={16} />
                AI Agents
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {agents.map((agent) => {
                const pool = agentPools.get(agent.id) || '0';
                const agentBetCount = agentBets.filter(b => b.agentId === agent.id).length;
                
                return (
                  <div 
                    key={agent.id}
                    className="bg-[#202020] border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-full border-2 border-[#121212]"
                        style={{ backgroundColor: agent.avatarColor }}
                      />
                      <div>
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <p className="text-xs text-gray-400 capitalize">{agent.strategyType} Strategy</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Pool:</span>
                        <span className="font-mono text-emerald-400">{formatPool(pool)} MON</span>
                      </div>
                      
                      {agentBetCount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Active Bets:</span>
                          <span className="font-mono text-blue-400">{agentBetCount}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleBetOnAgent(agent.id)}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      Bet on {agent.name.split(' ')[0]}
                    </button>
                  </div>
                );
              })}
              
              {agents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Loading agents...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
