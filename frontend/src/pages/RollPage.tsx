import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount } from 'wagmi';

const RARITY_ODDS = [
  { rarity: 'Common', odds: 50, characterCost: '0.1', cardCost: '0.05', color: '#9ca3af' },
  { rarity: 'Uncommon', odds: 30, characterCost: '0.25', cardCost: '0.1', color: '#22c55e' },
  { rarity: 'Rare', odds: 15, characterCost: '0.5', cardCost: '0.25', color: '#3b82f6' },
  { rarity: 'Epic', odds: 4, characterCost: '1', cardCost: '0.5', color: '#a855f7' },
  { rarity: 'Legendary', odds: 1, characterCost: '5', cardCost: '2', color: '#eab308' }
];

interface RollResult {
  rarity: string;
  species?: string;
  cardName?: string;
}

export default function RollPage() {
  const { isConnected } = useAccount();
  const [rollType, setRollType] = useState<'character' | 'card'>('character');
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<RollResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleRoll = async () => {
    if (!isConnected) return;
    
    setRolling(true);
    setResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const random = Math.random() * 100;
    let selectedRarity = 'Common';
    let cumulative = 0;
    for (const r of RARITY_ODDS) {
      cumulative += r.odds;
      if (random < cumulative) {
        selectedRarity = r.rarity;
        break;
      }
    }
    
    const speciesList = ['Charizard', 'Blastoise', 'Venusaur', 'Pikachu', 'Gengar', 'Dragonite', 'Snorlax', 'Lucario', 'Tyranitar', 'Gardevoir'];
    const cardNames = ['Power Boost', 'Defense Up', 'Fireball', 'Thunder', 'Heal', 'Double Strike', 'Quick Feet', 'Thick Skin'];
    
    setResult({
      rarity: selectedRarity,
      species: rollType === 'character' ? speciesList[Math.floor(Math.random() * speciesList.length)] : undefined,
      cardName: rollType === 'card' ? cardNames[Math.floor(Math.random() * cardNames.length)] : undefined
    });
    
    setRolling(false);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Roll for {rollType === 'character' ? 'Character' : 'Card'}
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Try your luck to get amazing {rollType === 'character' ? 'characters' : 'cards'}!
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setRollType('character')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              rollType === 'character'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Character
          </button>
          <button
            onClick={() => setRollType('card')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              rollType === 'card'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Card
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-8">
          {RARITY_ODDS.map((r) => (
            <motion.div
              key={r.rarity}
              whileHover={{ scale: 1.05 }}
              className="p-4 rounded-xl bg-gray-900/50 text-center"
              style={{ border: `1px solid ${r.color}40` }}
            >
              <div className="font-bold text-lg" style={{ color: r.color }}>{r.rarity}</div>
              <div className="text-2xl font-bold my-2" style={{ color: r.color }}>{r.odds}%</div>
              <div className="text-sm text-gray-400">
                {rollType === 'character' ? r.characterCost : r.cardCost} MON
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mb-12">
          <motion.button
            onClick={handleRoll}
            disabled={rolling || !isConnected}
            whileTap={{ scale: 0.95 }}
            className={`px-12 py-4 text-xl font-bold rounded-2xl ${
              rolling || !isConnected
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
            }`}
          >
            {rolling ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Rolling...
              </span>
            ) : !isConnected ? (
              'Connect Wallet to Roll'
            ) : (
              `Roll ${rollType === 'character' ? 'Character' : 'Card'} (${rollType === 'character' ? '0.1' : '0.05'} MON)`
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {showResult && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
              onClick={() => setShowResult(false)}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="bg-gray-900 p-8 rounded-3xl text-center max-w-md"
              >
                <div className="text-sm text-gray-400 mb-2">You got</div>
                <div 
                  className="text-3xl font-bold mb-4"
                  style={{ color: RARITY_ODDS.find(r => r.rarity === result.rarity)?.color }}
                >
                  {result.rarity}
                </div>
                <div className="text-4xl font-bold text-white mb-4">
                  {result.species || result.cardName}
                </div>
                <button
                  onClick={() => setShowResult(false)}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold"
                >
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
