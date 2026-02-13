import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Use PokeAPI sprites for authentic retro feel
const POKEMON_POOL = [
  { id: 1, name: "Bulbasaur", type: "Grass/Poison", color: "bg-green-600", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/1.png" },
  { id: 4, name: "Charmander", type: "Fire", color: "bg-orange-500", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/4.png" },
  { id: 7, name: "Squirtle", type: "Water", color: "bg-blue-500", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/7.png" },
  { id: 25, name: "Pikachu", type: "Electric", color: "bg-yellow-400", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/25.png" },
  { id: 133, name: "Eevee", type: "Normal", color: "bg-amber-700", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/133.png" },
  { id: 150, name: "Mewtwo", type: "Psychic", color: "bg-purple-600", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/150.png" },
  { id: 94, name: "Gengar", type: "Ghost/Poison", color: "bg-indigo-800", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/94.png" },
  { id: 143, name: "Snorlax", type: "Normal", color: "bg-slate-700", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/143.png" },
  { id: 129, name: "Magikarp", type: "Water", color: "bg-red-400", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/129.png" },
  { id: 130, name: "Gyarados", type: "Water/Flying", color: "bg-blue-700", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/130.png" },
  { id: 151, name: "Mew", type: "Psychic", color: "bg-pink-300", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/151.png" },
  { id: 3, name: "Venusaur", type: "Grass/Poison", color: "bg-green-700", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/3.png" },
  { id: 6, name: "Charizard", type: "Fire/Flying", color: "bg-orange-600", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/6.png" },
  { id: 9, name: "Blastoise", type: "Water", color: "bg-blue-700", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/9.png" },
];

export default function SpinnerPage() {
  const [spinning, setSpinning] = useState(false);
  const [collection, setCollection] = useState<typeof POKEMON_POOL>([]);
  const [spinResult, setSpinResult] = useState<typeof POKEMON_POOL[0] | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  // Generate a long strip of pokemon for the rolling animation
  // We repeat the pool multiple times to create the illusion of a long wheel
  const generateSpinStrip = () => {
    const strip = [];
    for (let i = 0; i < 50; i++) {
      strip.push(...POKEMON_POOL);
    }
    return strip;
  };

  const [spinStrip] = useState(generateSpinStrip());
  const stripRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Card width + gap
  const CARD_WIDTH = 128; // w-32
  const GAP = 16; // mx-2 = 8px * 2
  const ITEM_WIDTH = CARD_WIDTH + GAP;

  const handleSpin = () => {
    if (spinning) return;
    
    setSpinning(true);
    setSpinResult(null);

    // Randomly select a winner
    const winnerIndex = Math.floor(Math.random() * POKEMON_POOL.length);
    const winner = POKEMON_POOL[winnerIndex];

    // Calculate landing position
    const targetRepetition = 35 + Math.floor(Math.random() * 5); 
    const targetIndex = (targetRepetition * POKEMON_POOL.length) + winnerIndex;
    
    // Calculate precise scroll amount to center the winning card
    // The container has pl-[50%], so the start of the strip is already at the center of the viewport.
    // We want to shift the target item's center to align with that viewport center.
    // Distance from start of strip to center of target item:
    const scrollAmount = (targetIndex * ITEM_WIDTH) + (ITEM_WIDTH / 2);

    // Animate the strip
    if (stripRef.current) {
        const container = stripRef.current;
        
        // Reset to start (invisible jump) if needed
        // Since we regenerate the strip or just reuse it, we can just reset to 0 if we haven't spun too far
        // For simplicity, we just reset transition and transform to 0 before spinning
        container.style.transition = 'none';
        container.style.transform = 'translateX(0)';
        
        // Force reflow
        void container.offsetHeight;

        // Animate
        // cubic-bezier(0.1, 0.7, 0.1, 1) -> nice ease out
        container.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1)';
        container.style.transform = `translateX(-${scrollAmount}px)`;
    }

    // Flash effect just before stopping
    setTimeout(() => {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 200);
    }, 3800);

    setTimeout(() => {
      setSpinning(false);
      setSpinResult(winner);
      setCollection(prev => [winner, ...prev]); // Add to top of list
    }, 4000); 
  };

  return (
    <div className="min-h-screen pt-20 pb-10 flex flex-col items-center bg-[#202020] text-white font-pixel overflow-x-hidden">
      
      {/* Title */}
      <div className="mb-8 relative">
        <h1 className="text-4xl md:text-6xl font-black text-yellow-400 tracking-widest uppercase relative z-10 text-shadow-lg transform -skew-x-6">
          Gacha <span className="text-red-500">Corner</span>
        </h1>
        <div className="absolute top-1 left-1 w-full h-full text-blue-900 opacity-50 -z-10 transform -skew-x-6 select-none" aria-hidden="true">
             Gacha Corner
        </div>
      </div>

      {/* Main Machine Container */}
      <div className="relative w-full max-w-2xl px-4 mb-12">
        {/* Machine Body */}
        <div className="bg-gradient-to-br from-gray-700 to-gray-900 p-4 md:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.2)] border-b-8 border-r-8 border-black relative">
            
            {/* Screw heads */}
            <div className="absolute top-4 left-4 w-4 h-4 bg-gray-600 rounded-full border border-black shadow-inner flex items-center justify-center"><div className="w-2 h-0.5 bg-gray-800 rotate-45"></div></div>
            <div className="absolute top-4 right-4 w-4 h-4 bg-gray-600 rounded-full border border-black shadow-inner flex items-center justify-center"><div className="w-2 h-0.5 bg-gray-800 rotate-45"></div></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 bg-gray-600 rounded-full border border-black shadow-inner flex items-center justify-center"><div className="w-2 h-0.5 bg-gray-800 rotate-45"></div></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 bg-gray-600 rounded-full border border-black shadow-inner flex items-center justify-center"><div className="w-2 h-0.5 bg-gray-800 rotate-45"></div></div>

            {/* Screen Bezel */}
            <div className="bg-[#4a4a5a] p-4 rounded-xl shadow-[inset_0_5px_10px_rgba(0,0,0,0.8)] border-b-2 border-white/10">
                {/* The Screen Itself */}
            <div ref={viewportRef} className="relative bg-[#0f380f] overflow-hidden rounded-md border-4 border-black h-48 md:h-64 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                
                {/* Scanline Overlay */}
                    <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-20"></div>

                    {/* Selection Arrow / Bracket */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-36 -ml-[72px] z-10 pointer-events-none border-x-4 border-yellow-400/50 bg-white/5">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 text-yellow-400 text-2xl animate-bounce">▼</div>
                         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-1 text-yellow-400 text-2xl animate-bounce">▲</div>
                    </div>

                    {/* Rolling Strip */}
                    <div 
                        ref={stripRef}
                        className="flex items-center h-full pl-[50%] will-change-transform"
                    >
                        {spinStrip.map((poke, index) => (
                            <div 
                                key={`${poke.id}-${index}`}
                                className="flex-shrink-0 w-32 mx-2 flex flex-col items-center justify-center"
                            >
                                <div className={`
                                    w-28 h-28 ${poke.color} rounded-lg border-4 border-black shadow-md
                                    flex items-center justify-center relative overflow-hidden group
                                `}>
                                    <div className="absolute inset-0 bg-white opacity-10 rotate-12 scale-150 transform origin-top-left group-hover:opacity-20 transition-opacity"></div>
                                    <img 
                                        src={poke.image} 
                                        alt={poke.name} 
                                        className="w-24 h-24 object-contain rendering-pixelated z-10" 
                                    />
                                </div>
                                <div className="mt-2 text-xs font-bold text-[#9bbc0f] bg-[#0f380f] px-2 py-1 rounded border border-[#306230] uppercase tracking-widest">
                                    {poke.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Flash Effect */}
                    {showFlash && (
                        <div className="absolute inset-0 bg-white z-50 animate-[fadeOut_0.2s_ease-out_forwards]"></div>
                    )}
                </div>

                {/* Screen Label */}
                <div className="flex justify-between items-center mt-2 px-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[10px] uppercase text-gray-400 tracking-wider">BATTERY</span>
                    </div>
                    <span className="text-[10px] uppercase text-gray-400 tracking-wider font-bold">NINTENDO GAME BOY™</span>
                </div>
            </div>

            {/* Controls Area */}
            <div className="mt-8 flex justify-center items-center gap-12">
                {/* D-Pad Decoration */}
                <div className="w-24 h-24 relative opacity-80 pointer-events-none hidden md:block">
                    <div className="absolute top-0 left-8 w-8 h-24 bg-black rounded-sm shadow-lg"></div>
                    <div className="absolute top-8 left-0 w-24 h-8 bg-black rounded-sm shadow-lg"></div>
                    <div className="absolute top-9 left-9 w-6 h-6 bg-[#1a1a1a] rounded-full inset-shadow"></div>
                </div>

                {/* Spin Button */}
                <div className="relative group">
                    <button
                        onClick={handleSpin}
                        disabled={spinning}
                        className={`
                            relative z-10 w-24 h-24 rounded-full border-4 border-black shadow-[0_5px_0_#000]
                            flex items-center justify-center text-xl font-bold tracking-wider
                            transition-transform active:translate-y-[4px] active:shadow-none
                            ${spinning 
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                : 'bg-red-600 text-white hover:bg-red-500 hover:scale-105'
                            }
                        `}
                    >
                        {spinning ? '...' : 'A'}
                    </button>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs font-bold tracking-widest">SPIN</div>
                </div>

                {/* B Button Decoration */}
                <div className="relative group hidden md:block opacity-80 pointer-events-none">
                     <div className="w-24 h-24 rounded-full border-4 border-black bg-red-800 shadow-[0_5px_0_#000] flex items-center justify-center">
                         <span className="text-white/50 font-bold text-xl">B</span>
                     </div>
                     <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs font-bold tracking-widest">BACK</div>
                </div>
            </div>
        </div>

        {/* Result Message Box */}
        <AnimatePresence>
            {spinResult && !spinning && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-24 left-0 right-0 z-20"
                >
                    <div className="bg-white border-4 border-black p-4 rounded-lg shadow-xl relative">
                         {/* Triangle pointer */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[16px] border-b-black"></div>
                        <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white"></div>
                        
                        <p className="text-black text-center text-lg leading-relaxed">
                            <span className="animate-pulse">★</span> Wild <span className="font-bold text-red-600 uppercase">{spinResult.name}</span> was caught! <span className="animate-pulse">★</span>
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Collection Grid */}
      <div className="w-full max-w-4xl px-4 mt-16">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-4 text-white border-b-4 border-gray-700 pb-2">
          <span className="text-yellow-400 text-3xl">▼</span> 
          YOUR POKÉDEX ({collection.length})
        </h2>
        
        {collection.length === 0 ? (
          <div className="text-center py-16 border-4 border-dashed border-gray-700 rounded-xl text-gray-500 bg-black/20">
            <p className="text-xl mb-2">PC BOX IS EMPTY</p>
            <p className="text-sm">PRESS 'A' TO CATCH POKÉMON</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {collection.map((poke, i) => (
              <motion.div
                key={`${poke.id}-${i}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                    relative group cursor-pointer
                    bg-gray-800 border-2 border-gray-600 hover:border-white hover:bg-gray-700
                    rounded-lg p-2 transition-all duration-200
                `}
              >
                <div className={`
                    aspect-square rounded flex items-center justify-center bg-black/40 mb-2 relative overflow-hidden
                `}>
                    <img src={poke.image} alt={poke.name} className="w-16 h-16 object-contain rendering-pixelated group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-center">
                    <div className="text-[10px] text-gray-400 font-mono">No.{poke.id.toString().padStart(3, '0')}</div>
                    <div className="text-xs font-bold text-white truncate">{poke.name}</div>
                </div>
                
                {/* New Badge for latest catch */}
                {i === 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-white animate-bounce">
                        NEW!
                    </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
