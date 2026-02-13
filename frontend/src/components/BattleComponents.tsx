import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { BattlePokemon, BattleState } from '../services/GameWebSocket';

export const PokemonCard = ({ pokemon, isActive }: { pokemon: BattlePokemon; isActive: boolean; isOpponent?: boolean }) => {
    const hpPercent = (pokemon.stats.hp / pokemon.stats.maxHp) * 100;

    const initialImg = `/poke/${encodeURIComponent(pokemon.speciesName)}.png`;
    const candidates = [
        initialImg,
        `/poke/${encodeURIComponent(pokemon.speciesName.toLowerCase())}.png`,
        '/poke/default.png',
    ];
    const [imgSrc, setImgSrc] = useState(initialImg);

    useEffect(() => {
        setImgSrc(initialImg);
    }, [initialImg]);

    return (
        <div className={`
            relative w-80 bg-[#222] border-4 border-white shadow-[8px_8px_0px_rgba(0,0,0,0.8)]
            flex flex-col p-2 gap-2
            ${isActive ? '' : 'opacity-60'}
        `}>
            {/* Header: Name & Type (Trading Card Style) */}
            <div className="flex justify-between items-center bg-[#111] px-2 py-1 border border-gray-600">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{pokemon.speciesName}</h3>
                <div className="flex gap-1">
                    {pokemon.types.map(t => (
                        <span key={t} className="text-[9px] px-1 bg-white text-black font-bold uppercase">{t}</span>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex gap-3">
                {/* Left: Big Sprite Portrait */}
                <div className="w-32 h-32 bg-[#111] border-2 border-gray-500 relative flex-shrink-0">
                    {/* Background Pattern for Card Art */}
                    <div className="absolute inset-0 bg-[radial-gradient(#333_2px,transparent_2px)] bg-[size:8px_8px] opacity-30"></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img
                            src={imgSrc}
                            alt={pokemon.speciesName}
                            className={`w-28 h-28 object-contain rendering-pixelated ${pokemon.stats.hp <= 0 ? 'grayscale opacity-50' : ''}`}
                            onError={() => {
                                const idx = candidates.indexOf(imgSrc);
                                const next = candidates[idx + 1] ?? '/poke/default.png';
                                if (next !== imgSrc) setImgSrc(next);
                            }}
                        />
                    </div>
                </div>

                {/* Right: Stats Panel */}
                <div className="flex-1 flex flex-col justify-between">
                    
                    {/* Stats Grid */}
                    <div className="flex flex-col gap-1.5">
                        {/* HP */}
                        <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-bold text-red-400">HP</span>
                                <span className="text-[9px] font-mono text-gray-300">{pokemon.stats.hp}/{pokemon.stats.maxHp}</span>
                            </div>
                            <div className="w-full h-2 bg-[#333] border border-gray-600">
                                <div 
                                    className={`h-full ${hpPercent > 50 ? 'bg-green-500' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${hpPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* SPD & ATK (Mini Stats) */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="bg-[#111] px-1 border border-gray-700 flex justify-between items-center">
                                <span className="text-[8px] text-gray-500">SPD</span>
                                <span className="text-[9px] text-white font-mono">{pokemon.stats.speed}</span>
                            </div>
                            <div className="bg-[#111] px-1 border border-gray-700 flex justify-between items-center">
                                <span className="text-[8px] text-gray-500">ATK</span>
                                <span className="text-[9px] text-white font-mono">{pokemon.stats.attack}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Moves List */}
            {isActive && (
                <div className="mt-1">
                    <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">Moves</div>
                    <div className="grid grid-cols-2 gap-2">
                        {pokemon.moves.slice(0, 4).map(m => {
                            const cooldown = pokemon.cooldowns?.[m.name] || 0;
                            const isReady = cooldown <= 0;
                            
                            return (
                                <div key={m.name} className={`
                                    relative bg-[#1a1a1a] border ${isReady ? 'border-gray-500' : 'border-red-900'} 
                                    px-2 py-1.5 flex flex-col justify-center h-10 overflow-hidden
                                `}>
                                    {/* Cooldown Overlay */}
                                    {!isReady && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                            <span className="text-red-500 font-bold text-xs">{cooldown}s</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={`text-[9px] font-bold uppercase truncate ${isReady ? 'text-white' : 'text-gray-600'}`}>{m.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[7px] text-gray-500 uppercase">{m.type}</span>
                                        {isReady && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.8)]"></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const PhaseIndicator = ({ phase, turn, bettingEndTime }: { phase: string; turn: number; bettingEndTime?: number }) => {
    const phases = [
        { id: 'betting', label: 'BET', icon: '[$]' },
        { id: 'waiting', label: 'PREP', icon: '[!]' },
        { id: 'action', label: 'FIGHT', icon: '[X]' },
        { id: 'finished', label: 'END', icon: '[#]' }
    ];
    
    const currentIndex = phases.findIndex(p => p.id === phase);
    const [countdown, setCountdown] = useState(0);
    
    useEffect(() => {
        if (phase === 'betting' && bettingEndTime) {
            const interval = setInterval(() => {
                const remaining = Math.max(0, Math.ceil((bettingEndTime - Date.now()) / 1000));
                setCountdown(remaining);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [phase, bettingEndTime]);
    
    return (
        <div className="bg-[#1a1a1a] border-4 border-white p-3 shadow-[6px_6px_0px_rgba(0,0,0,0.8)] inline-block">
            <div className="flex items-center gap-6 text-white text-sm font-bold tracking-widest">
                <span className="bg-white text-black px-3 py-1">TURN {turn}</span>
                <div className="flex gap-4">
                    {phases.map((p, i) => (
                        <span key={p.id} className={`${i === currentIndex ? 'text-yellow-400' : 'text-gray-600'} ${i === currentIndex ? 'animate-pulse' : ''}`}>
                            {i === currentIndex ? `> ${p.label} <` : p.label}
                        </span>
                    ))}
                </div>
                {phase === 'betting' && countdown > 0 && (
                     <span className="animate-pulse text-red-500">{countdown}s</span>
                )}
            </div>
        </div>
    );
};

const TypewriterText = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        setDisplayedText('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(() => text.substring(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 20);
        return () => clearInterval(timer);
    }, [text]);

    return <span>{displayedText}</span>;
};


export const PokemonSpinner = () => {
    const [spinning, setSpinning] = useState(false);
    const [collected, setCollected] = useState<BattlePokemon[]>([]);
    
    const spin = async () => {
        if (spinning) return;
        setSpinning(true);
        
        // Simulate spinning animation
        await new Promise(r => setTimeout(r, 1000));
        
        try {
            const res = await fetch('http://localhost:8080/spin', { method: 'POST' });
            if (!res.ok) throw new Error('Spin failed');
            const pokemon = await res.json();
            setCollected(prev => [pokemon, ...prev]);
        } catch (e) {
            console.error(e);
        } finally {
            setSpinning(false);
        }
    };
    
    return (
        <div className="flex flex-col items-center gap-8 p-8 w-full max-w-6xl mx-auto">
            <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-20 animate-pulse"></div>
                <button 
                    onClick={spin} 
                    disabled={spinning}
                    className={`
                        relative z-10 px-12 py-6 bg-gradient-to-b from-yellow-400 to-yellow-600 
                        text-black font-black text-2xl uppercase tracking-widest 
                        border-4 border-white shadow-[8px_8px_0px_rgba(0,0,0,0.8)]
                        transform transition-all duration-100
                        ${spinning ? 'scale-95 opacity-80 cursor-wait' : 'hover:scale-105 active:scale-95 active:shadow-none hover:brightness-110'}
                    `}
                >
                    {spinning ? (
                        <span className="flex items-center gap-2">
                            <span className="animate-spin text-xl">★</span> SPINNING...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <span className="text-xl">★</span> SPIN GACHA <span className="text-xl">★</span>
                        </span>
                    )}
                </button>
            </div>
            
            {collected.length === 0 && (
                <div className="text-gray-500 font-pixel text-center mt-12 animate-pulse">
                    NO POKEMON COLLECTED YET... <br/>
                    TRY YOUR LUCK!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                <AnimatePresence mode='popLayout'>
                    {collected.map((p) => (
                        <motion.div 
                            key={p.id}
                            layout
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                        >
                            <PokemonCard pokemon={p} isActive={true} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const BattleScene = ({ state }: { state: BattleState }) => {
    const { playerA, playerB, log } = state;
    
    if (!playerA.team.length || !playerB.team.length) return <div className="text-white text-center mt-20 text-xl animate-pulse">INSERTING CARTRIDGE...</div>;

    const activeA = playerA.team[playerA.activePokemonIndex];
    const activeB = playerB.team[playerB.activePokemonIndex];
    
    return (
        <div className="w-full h-full relative bg-[#202028] overflow-hidden font-pixel select-none">
            
            {/* Full Screen Background with Animated Grid */}
            <div className="absolute inset-0 z-0 opacity-20" 
                style={{ 
                    backgroundImage: 'linear-gradient(#4a4a5a 1px, transparent 1px), linear-gradient(90deg, #4a4a5a 1px, transparent 1px)', 
                    backgroundSize: '40px 40px',
                    animation: 'grid-scroll 20s linear infinite'
                }} 
            />
            
            {/* Top HUD: Phase & Turn */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
                <PhaseIndicator phase={state.phase} turn={state.turn} bettingEndTime={state.bettingEndTime} />
            </div>

            {/* Battle Stage Layer */}
            <div className="absolute inset-0 z-10 flex flex-col justify-center">
                
                {/* Opponent Platform (Top Right) */}
                <div className="absolute top-[15%] right-[10%] flex flex-col items-end">
                    {/* Status Bar */}
                    <div className="bg-[#111] border-2 border-white px-3 py-1 mb-1 flex items-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform translate-y-2 translate-x-4 z-20">
                        <h2 className="text-xs font-bold text-white uppercase tracking-wider">{playerB.name}</h2>
                         <div className="flex gap-1">
                            {playerB.team.map((p, i) => (
                                <div key={i} className={`w-2 h-2 border border-white ${p.stats.hp > 0 ? 'bg-cyan-500' : 'bg-[#333]'}`} />
                            ))}
                        </div>
                    </div>
                    
                    {/* Sprite & Platform */}
                    <div className="relative">
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/40 rounded-[50%] blur-sm scale-y-50"></div>
                        <div className="relative z-10">
                            {activeB && <PokemonCard pokemon={activeB} isActive={true} isOpponent={true} />}
                        </div>
                    </div>
                </div>

                {/* Player Platform (Bottom Left) */}
                <div className="absolute bottom-[25%] left-[10%] flex flex-col items-start">
                    {/* Sprite & Platform */}
                    <div className="relative z-10">
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/40 rounded-[50%] blur-sm scale-y-50"></div>
                        <div className="relative z-10">
                            {activeA && <PokemonCard pokemon={activeA} isActive={true} />}
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="bg-[#111] border-2 border-white px-3 py-1 mt-1 flex items-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] transform -translate-y-2 -translate-x-4 z-20">
                         <h2 className="text-xs font-bold text-white uppercase tracking-wider">{playerA.name}</h2>
                         <div className="flex gap-1">
                            {playerA.team.map((p, i) => (
                                <div key={i} className={`w-2 h-2 border border-white ${p.stats.hp > 0 ? 'bg-red-500' : 'bg-[#333]'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay Text Box (Classic RPG Style) */}
            <div className="absolute bottom-4 left-4 right-4 h-32 z-40">
                <div className="h-full bg-[#1a1a1a]/95 border-4 border-white p-4 flex gap-4 shadow-[8px_8px_0px_rgba(0,0,0,0.8)] relative">
                    {/* Animated Cursor */}

                    {/* Main Log Area */}
                    <div className="flex-1 overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {log.length > 0 ? (
                                <motion.div 
                                    key={log[log.length - 1]}
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col justify-start"
                                >
                                    <p className="text-xs md:text-sm text-white font-bold leading-relaxed uppercase tracking-wide font-pixel text-shadow-sm">
                                        <span className="text-yellow-400 mr-2">*</span>
                                        <TypewriterText text={log[log.length - 1]} />
                                    </p>
                                </motion.div>
                            ) : (
                                <p className="text-gray-500 text-xs uppercase typing-effect">WAITING FOR COMMAND...</p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Side Info Panel */}
                    <div className="w-1/4 border-l-2 border-gray-600 pl-4 flex flex-col justify-between text-[10px] text-gray-400 font-mono">
                        <div>
                            <div className="text-yellow-600 mb-1">LAST ACTION:</div>
                            <div className="text-white truncate">{log.length > 1 ? log[log.length - 2] : '-'}</div>
                        </div>
                        <div className="flex justify-between items-end">
                            <span>PHASE:</span>
                            <span className={`font-bold ${state.phase === 'betting' ? 'text-green-400' : 'text-red-400'}`}>
                                {state.phase.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

             {/* Winner Overlay */}
             {state.winner && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] border-4 border-white p-8 text-center shadow-[0_0_50px_rgba(255,215,0,0.2)] max-w-sm w-full mx-4">
                        <h2 className="text-4xl font-bold text-yellow-400 mb-6 uppercase tracking-widest text-shadow-lg">VICTORY</h2>
                        <div className="w-full h-1 bg-white mb-6"></div>
                        <p className="text-xl text-white font-bold mb-2">
                            {state.winner === 'playerA' ? playerA.name : playerB.name}
                        </p>
                        <p className="text-sm text-gray-400 uppercase tracking-wider">WINS THE BATTLE</p>
                    </div>
                </div>
            )}
        </div>
    );
}
