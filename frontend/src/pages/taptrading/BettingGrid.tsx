import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, Coins, TrendingUp } from 'lucide-react';

interface PricePoint {
  time: string;
  price: number;
}

interface Bet {
  id: string;
  colIndex: number;
  rowIndex: number;
  targetPrice: number;
  amount: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
  checked?: boolean;
  agentId?: string;
  agentColor?: string;
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

// Config Constants - Optimized for BTC ($20-30 increments)
const CELL_WIDTH = 60;
const CELL_HEIGHT = 30;
const PRICE_STEP = 25; // $25 increments for BTC price
const HEAD_SCREEN_X = 250;
const TIME_PER_CELL = 1.0;

// Agent colors for display
const AGENT_COLORS = {
  alpha: '#FF4444',
  beta: '#4444FF', 
  gamma: '#44FF44',
  delta: '#FFAA00'
};

export function BettingGrid({ 
  currentPrice, 
  balance, 
  onBetResult, 
  priceHistory,
  agentBets = [] 
}: {
  currentPrice: number;
  balance: number;
  onBetResult: (won: boolean, amount: number, multiplier: number) => void;
  priceHistory: PricePoint[];
  agentBets?: AgentBet[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const cameraXRef = useRef(0);
  const layoutRef = useRef<number | undefined>(undefined);
  const smoothHeadPriceRef = useRef(currentPrice);
  const lastDataTimeRef = useRef(Date.now());
  const initialSyncDone = useRef(false);
  
  const [bets, setBets] = useState<Bet[]>([]);
  const betsRef = useRef<Bet[]>([]);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [cameraPrice, setCameraPrice] = useState(currentPrice);

  useEffect(() => { betsRef.current = bets; }, [bets]);

  useEffect(() => {
    const updateDim = () => {
      if (containerRef.current) {
        setDimensions({ 
          width: containerRef.current.clientWidth, 
          height: containerRef.current.clientHeight 
        });
      }
    };
    window.addEventListener('resize', updateDim);
    updateDim();
    return () => window.removeEventListener('resize', updateDim);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCameraPrice(prev => {
        const diff = currentPrice - prev;
        if (Math.abs(diff) < 0.1) return currentPrice;
        return prev + diff * 0.1;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [currentPrice]);

  useEffect(() => {
    if (priceHistory.length > 0) {
      lastDataTimeRef.current = Date.now();
      
      if (!initialSyncDone.current) {
        const targetHeadX = (priceHistory.length - 1) * CELL_WIDTH + (CELL_WIDTH / 2);
        cameraXRef.current = targetHeadX - HEAD_SCREEN_X;
        smoothHeadPriceRef.current = currentPrice;
        initialSyncDone.current = true;
      }
    }
  }, [priceHistory.length, currentPrice]);

  // Merge user bets with agent bets
  const allBets = useMemo(() => {
    const userBets = betsRef.current;
    const formattedAgentBets: Bet[] = agentBets.map((ab, idx) => ({
      id: `agent-${ab.agentId}-${idx}`,
      colIndex: ab.colIndex,
      rowIndex: ab.rowIndex,
      targetPrice: (ab.rowIndex + 0.5) * PRICE_STEP,
      amount: ab.amount,
      multiplier: ab.multiplier,
      status: ab.status,
      agentId: ab.agentId,
      agentColor: ab.agentColor,
      checked: ab.status !== 'pending'
    }));
    return [...userBets, ...formattedAgentBets];
  }, [bets, agentBets]);

  const centerY = dimensions.height / 2;
  const centerRow = Math.floor(cameraPrice / PRICE_STEP);

  const animate = useCallback(() => {
    if (priceHistory.length > 0) {
      const timeSinceUpdate = (Date.now() - lastDataTimeRef.current) / 1000;
      const clampedTime = Math.min(timeSinceUpdate, 1.5);
      
      const baseHeadX = (priceHistory.length - 1) * CELL_WIDTH + (CELL_WIDTH / 2);
      const headOffset = clampedTime * (CELL_WIDTH / TIME_PER_CELL);
      const currentHeadX = baseHeadX + headOffset;
      
      const targetCamera = currentHeadX - HEAD_SCREEN_X;
      cameraXRef.current += (targetCamera - cameraXRef.current) * 0.15;
      
      const headWorldX = currentHeadX;
      const pendingBets = allBets.filter(b => b.status === 'pending' && !b.checked);
      let stateChanged = false;
      let newBets = [...allBets];
      
      pendingBets.forEach(bet => {
        if (bet.agentId) return; // Skip agent bets - backend handles those
        
        const betCenterWorldX = (bet.colIndex * CELL_WIDTH) + (CELL_WIDTH / 2);
        
        if (headWorldX >= betCenterWorldX) {
          const rowBottom = bet.rowIndex * PRICE_STEP;
          const rowTop = (bet.rowIndex + 1) * PRICE_STEP;
          const won = currentPrice >= rowBottom && currentPrice < rowTop;
          
          newBets = newBets.map(b => 
            b.id === bet.id 
              ? { ...b, status: won ? 'won' : 'lost', checked: true } 
              : b
          );
          
          stateChanged = true;
          onBetResult(won, bet.amount, bet.multiplier);
        }
      });
      
      if (stateChanged) setBets(newBets.filter(b => !b.agentId)); // Only update user bets
      
    }
    
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translateX(${-cameraXRef.current}px)`;
    }
    
    layoutRef.current = requestAnimationFrame(animate);
  }, [priceHistory, currentPrice, cameraPrice, onBetResult, allBets]);

  useEffect(() => {
    layoutRef.current = requestAnimationFrame(animate);
    return () => {
      if (layoutRef.current) cancelAnimationFrame(layoutRef.current);
    };
  }, [animate]);

  const handleCellClick = (colIndex: number, rowIndex: number) => {
    const headWorldX = cameraXRef.current + HEAD_SCREEN_X;
    const betWorldX = colIndex * CELL_WIDTH + (CELL_WIDTH / 2);
    
    if (betWorldX <= headWorldX) return;
    if (balance < 1) return;
    if (allBets.some(b => b.colIndex === colIndex && b.rowIndex === rowIndex)) return;
    
    const currentRow = Math.floor(currentPrice / PRICE_STEP);
    const rowDist = Math.abs(rowIndex - currentRow);
    const timeDist = Math.max(0, (betWorldX - headWorldX) / CELL_WIDTH);
    
    const baseMult = 1.0 + (rowDist * 0.3) + (timeDist * 0.15);
    const multiplier = parseFloat((Math.pow(baseMult, 1.8)).toFixed(2));
    
    const newBet: Bet = {
      id: Math.random().toString(36),
      colIndex,
      rowIndex,
      targetPrice: (rowIndex + 0.5) * PRICE_STEP,
      amount: 1,
      multiplier,
      status: 'pending',
      checked: false,
    };
    
    setBets(prev => [...prev, newBet]);
  };

  const currentDataTick = priceHistory.length;
  const startCol = Math.max(0, currentDataTick - 12);
  const endCol = currentDataTick + 30;
  
  const colsToRender = [];
  for (let c = startCol; c <= endCol; c++) colsToRender.push(c);
  
  const visibleRows = 18;
  const rowsToRender: number[] = [];
  for (let r = centerRow - visibleRows; r <= centerRow + visibleRows; r++) {
    rowsToRender.push(r);
  }

  // Group bets by cell for display
  const betsByCell = useMemo(() => {
    const map = new Map<string, Bet[]>();
    allBets.forEach(bet => {
      const key = `${bet.colIndex}-${bet.rowIndex}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(bet);
    });
    return map;
  }, [allBets]);

  const historyPoints = useMemo(() => {
    // Only process visible history for performance
    const visibleStart = Math.max(0, currentDataTick - 20);
    const visibleHistory = priceHistory.slice(visibleStart, currentDataTick);
    
    if (visibleHistory.length < 2) {
      return visibleHistory.map((pt, i) => {
        const actualIndex = visibleStart + i;
        const x = (actualIndex * CELL_WIDTH) + (CELL_WIDTH / 2);
        const diff = pt.price - cameraPrice;
        const y = centerY - (diff / PRICE_STEP * CELL_HEIGHT);
        return { x, y };
      });
    }

    // Create smooth interpolated points using cubic bezier
    const smoothPoints: { x: number; y: number }[] = [];
    
    for (let i = 0; i < visibleHistory.length; i++) {
      const actualIndex = visibleStart + i;
      const pt = visibleHistory[i];
      const x = (actualIndex * CELL_WIDTH) + (CELL_WIDTH / 2);
      const diff = pt.price - cameraPrice;
      const y = centerY - (diff / PRICE_STEP * CELL_HEIGHT);
      
      if (i === 0) {
        smoothPoints.push({ x, y });
      } else {
        const prevPt = visibleHistory[i - 1];
        const prevActualIndex = visibleStart + i - 1;
        const prevX = (prevActualIndex * CELL_WIDTH) + (CELL_WIDTH / 2);
        const prevDiff = prevPt.price - cameraPrice;
        const prevY = centerY - (prevDiff / PRICE_STEP * CELL_HEIGHT);
        
        // Get control points for cubic bezier curve
        const p0 = i >= 2 ? visibleHistory[i - 2] : prevPt;
        const p0ActualIndex = i >= 2 ? visibleStart + i - 2 : prevActualIndex;
        const p0X = (p0ActualIndex * CELL_WIDTH) + (CELL_WIDTH / 2);
        const p0Diff = p0.price - cameraPrice;
        const p0Y = centerY - (p0Diff / PRICE_STEP * CELL_HEIGHT);
        
        const p3 = i < visibleHistory.length - 1 ? visibleHistory[i + 1] : pt;
        const p3ActualIndex = i < visibleHistory.length - 1 ? visibleStart + i + 1 : actualIndex;
        const p3X = (p3ActualIndex * CELL_WIDTH) + (CELL_WIDTH / 2);
        const p3Diff = p3.price - cameraPrice;
        const p3Y = centerY - (p3Diff / PRICE_STEP * CELL_HEIGHT);
        
        // Calculate control points for smooth curve (Catmull-Rom to Bezier)
        const tension = 0.3;
        const cp1x = prevX + (x - p0X) * tension;
        const cp1y = prevY + (y - p0Y) * tension;
        const cp2x = x - (p3X - prevX) * tension;
        const cp2y = y - (p3Y - prevY) * tension;
        
        // Generate points along the bezier curve
        const segments = 4;
        for (let t = 1; t <= segments; t++) {
          const ratio = t / segments;
          const mt = 1 - ratio;
          const mt2 = mt * mt;
          const mt3 = mt2 * mt;
          const t2 = ratio * ratio;
          const t3 = t2 * ratio;
          
          const bx = mt3 * prevX + 3 * mt2 * ratio * cp1x + 3 * mt * t2 * cp2x + t3 * x;
          const by = mt3 * prevY + 3 * mt2 * ratio * cp1y + 3 * mt * t2 * cp2y + t3 * y;
          
          smoothPoints.push({ x: bx, y: by });
        }
      }
    }
    
    return smoothPoints;
  }, [priceHistory, cameraPrice, centerY, currentDataTick]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 z-30 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-xs text-slate-400">BTC Price</div>
                <div className="text-lg font-bold text-white">
                  ${currentPrice.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400">Balance</div>
              <div className="text-lg font-bold text-emerald-400">
                ${balance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 top-16 overflow-hidden">
        {/* Main grid area */}
        <div className="absolute inset-0 bottom-8">
          {/* Fixed price labels on the right */}
          <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-30">
            {rowsToRender.map((rowIdx) => {
              const price = rowIdx * PRICE_STEP;
              const diff = price - cameraPrice;
              const y = centerY - (diff / PRICE_STEP * CELL_HEIGHT);
              const isCurrentPriceRow = Math.abs(price - currentPrice) < PRICE_STEP;
              
              return (
                <div
                  key={rowIdx}
                  className="absolute right-4 transform -translate-y-1/2"
                  style={{ top: `${y}px` }}
                >
                  <div className={`
                    text-xs font-mono px-2 py-1 rounded whitespace-nowrap shadow-lg
                    ${isCurrentPriceRow 
                      ? 'bg-orange-500/90 text-white font-bold border border-orange-300' 
                      : 'text-white bg-slate-800/90 border border-slate-600/50'
                    }
                  `}>
                    ${price.toFixed(2)}
                  </div>
                </div>
            );
          })}
        </div>

        {/* Time axis at bottom */}
        <div className="absolute left-0 right-0 bottom-0 h-8 bg-slate-900/90 border-t border-slate-700/50 pointer-events-none z-30 overflow-hidden">
          <div 
            className="absolute h-full"
            style={{ transform: `translateX(${-cameraXRef.current}px)` }}
          >
            {colsToRender.map(colIdx => {
              const x = colIdx * CELL_WIDTH;
              const isDataColumn = colIdx < priceHistory.length;
              
              let timeLabel = '';
              if (isDataColumn && priceHistory[colIdx]) {
                const timeStr = priceHistory[colIdx].time;
                try {
                  const date = new Date(timeStr);
                  if (!isNaN(date.getTime())) {
                    timeLabel = date.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: false
                    });
                  }
                } catch (e) {
                  console.error('Invalid date:', timeStr);
                }
              } else if (priceHistory.length > 0 && colIdx >= priceHistory.length) {
                // Calculate future time based on TIME_PER_CELL
                try {
                  const lastTime = new Date(priceHistory[priceHistory.length - 1].time);
                  if (!isNaN(lastTime.getTime())) {
                    const secondsAhead = (colIdx - priceHistory.length + 1) * TIME_PER_CELL;
                    const futureTime = new Date(lastTime.getTime() + secondsAhead * 1000);
                    timeLabel = futureTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      hour12: false
                    });
                  }
                } catch (e) {
                  // Skip invalid future times
                }
              }
              
              return timeLabel && colIdx % 3 === 0 ? (
                <div
                  key={colIdx}
                  className={`absolute top-1/2 -translate-y-1/2 text-[10px] font-mono whitespace-nowrap ${
                    isDataColumn ? 'text-slate-300' : 'text-slate-500 italic'
                  }`}
                  style={{ left: `${x + CELL_WIDTH / 2}px`, transform: 'translate(-50%, -50%)' }}
                >
                  {timeLabel}
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

          {/* Gradient overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10" />

          <div 
            ref={canvasRef}
            className="absolute left-0 top-0 will-change-transform"
            style={{ height: '100%' }}
          >
            {/* Price line visualization */}
            <div className="absolute left-0 top-0 pointer-events-none z-20" style={{ height: '100%' }}>
              {historyPoints.map((point, i) => {
                if (i === 0) return null;
                const prevPoint = historyPoints[i - 1];
                
                const length = Math.sqrt(
                  Math.pow(point.x - prevPoint.x, 2) + 
                  Math.pow(point.y - prevPoint.y, 2)
                );
                const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * 180 / Math.PI;
                
                return (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${prevPoint.x}px`,
                      top: `${prevPoint.y}px`,
                      width: `${length}px`,
                      height: '3px',
                      background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.9), rgba(59, 130, 246, 1))',
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '0 50%',
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
                      borderRadius: '1.5px',
                    }}
                  />
                );
              })}
              
              {/* Current price indicator circle - only show at actual last data point */}
              {priceHistory.length > 0 && historyPoints.length > 0 && (
                <div
                  className="absolute rounded-full bg-blue-400 border-2 border-white -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{
                    width: '10px',
                    height: '10px',
                    left: `${historyPoints[historyPoints.length - 1].x}px`,
                    top: `${historyPoints[historyPoints.length - 1].y}px`,
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)',
                  }}
                />
              )}
            </div>

            {colsToRender.map(colIdx => {
              const x = colIdx * CELL_WIDTH;
            const isDataColumn = colIdx < priceHistory.length;
            const timeLabel = isDataColumn && priceHistory[colIdx] 
              ? new Date(priceHistory[colIdx].time).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: false
                })
              : '';
            
            return (
              <div
                key={colIdx}
                className="absolute top-0"
                style={{ left: `${x}px`, width: `${CELL_WIDTH}px`, height: '100%' }}
              >
                
                {rowsToRender.map((rowIdx) => {
                  const price = rowIdx * PRICE_STEP;
                  const diff = price - cameraPrice;
                  const y = centerY - (diff / PRICE_STEP * CELL_HEIGHT) - (CELL_HEIGHT / 2);
                  
                  const cellBets = betsByCell.get(`${colIdx}-${rowIdx}`) || [];
                  const userBet = cellBets.find(b => !b.agentId);
                  const agentBetsInCell = cellBets.filter(b => b.agentId);
                  
                  const currentRow = Math.floor(currentPrice / PRICE_STEP);
                  const rowDist = Math.abs(rowIdx - currentRow);
                  const colDist = Math.abs(colIdx - currentDataTick);
                  const displayMult = (Math.pow(1.0 + (rowDist * 0.3) + (colDist * 0.15), 1.8)).toFixed(1);
                  
                  const isCurrentPriceRow = rowIdx === currentRow;
                  
                  return (
                    <div
                      key={rowIdx}
                      className="absolute"
                      style={{ 
                        left: '2px',
                        top: `${y}px`,
                        width: `${CELL_WIDTH - 4}px`,
                        height: `${CELL_HEIGHT - 4}px`,
                      }}
                    >
                      <div
                        className={`
                          w-full h-full rounded-lg border transition-all cursor-pointer
                          flex flex-col items-center justify-center gap-0 relative
                          ${userBet 
                            ? userBet.status === 'won'
                              ? 'bg-emerald-500/50 border-emerald-400 shadow-lg shadow-emerald-500/50'
                              : userBet.status === 'lost'
                              ? 'bg-red-500/50 border-red-400 shadow-lg shadow-red-500/50'
                              : 'bg-blue-500/60 border-blue-300 shadow-lg shadow-blue-500/50'
                            : isCurrentPriceRow
                            ? 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20'
                            : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-700/40'
                          }
                        `}
                        onClick={() => handleCellClick(colIdx, rowIdx)}
                      >
                        {userBet ? (
                          <>
                            <div className="text-[9px] font-bold text-white leading-none">{userBet.multiplier}x</div>
                            <div className="text-[8px] text-white/90 leading-none">${userBet.amount}</div>
                          </>
                        ) : (
                          <div className="text-[9px] font-semibold text-slate-400">
                            {displayMult}x
                          </div>
                        )}
                        
                        {/* Agent bet indicators */}
                        {agentBetsInCell.length > 0 && (
                          <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5">
                            {agentBetsInCell.map((bet, idx) => (
                              <div
                                key={idx}
                                className="w-2 h-2 rounded-full border border-white/50"
                                style={{ backgroundColor: bet.agentColor || '#888' }}
                                title={`Agent bet: ${bet.multiplier}x`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div 
          className="absolute left-0 right-0 border-t-2 border-orange-500/50 pointer-events-none z-10"
          style={{ top: `${centerY}px` }}
        >
          <div className="absolute left-1/2 -translate-x-1/2 -top-3">
            <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
