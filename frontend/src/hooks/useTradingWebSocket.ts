import { useEffect, useRef, useState } from 'react';

interface TradingEvent {
  event: string;
  data: any;
  timestamp: string;
}

export function useTradingWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [price, setPrice] = useState<string>('0');
  const [agentPools, setAgentPools] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log('✅ Trading WebSocket connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const message: TradingEvent = JSON.parse(event.data);

      switch (message.event) {
        case 'round_started':
          setCurrentRound(message.data);
          setAgents(message.data.agents || []);
          break;

        case 'trading_started':
          if (message.data.agentPools) {
            const poolMap = new Map();
            message.data.agentPools.forEach((pool: any) => {
              poolMap.set(pool.agentId, pool.poolSize);
            });
            setAgentPools(poolMap);
          }
          break;

        case 'agent_pool_update':
          setAgentPools(prev => new Map(prev).set(message.data.agentId, message.data.newPoolSize));
          break;

        case 'price_update':
          setPrice(message.data.price);
          break;

        case 'leaderboard_update':
          setLeaderboard(message.data.rankings || []);
          break;

        case 'round_settled':
          console.log('Round settled:', message.data);
          break;

        case 'round_cancelled':
          console.log('Round cancelled:', message.data.reason);
          break;
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const subscribeToRound = (roundId: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'subscribe', roundId }));
    }
  };

  const unsubscribeFromRound = (roundId: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'unsubscribe', roundId }));
    }
  };

  return {
    isConnected,
    currentRound,
    agents,
    leaderboard,
    price,
    agentPools,
    subscribeToRound,
    unsubscribeFromRound,
  };
}
