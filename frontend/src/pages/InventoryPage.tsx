import { useState } from 'react';
import { motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#eab308'
};

interface Character {
  id: string;
  tokenId: number;
  species: string;
  rarity: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
}

interface Card {
  id: string;
  tokenId: number;
  name: string;
  rarity: string;
  cardType: string;
  description: string;
}

export default function InventoryPage() {
  const { address, isConnected } = useAccount();
  const [view, setView] = useState<'characters' | 'cards'>('characters');
  const [selectedTeamSlots, setSelectedTeamSlots] = useState<string[]>([]);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', address],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/roll/inventory/${address}`);
      return res.json();
    },
    enabled: !!address
  });

  const { data: team } = useQuery({
    queryKey: ['team', address],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/roll/team/${address}`);
      return res.json();
    },
    enabled: !!address
  });

  const characters: Character[] = inventory?.inventory?.characters || [];
  const cards: Card[] = inventory?.inventory?.cards || [];

  const toggleTeamSlot = (charId: string) => {
    if (selectedTeamSlots.includes(charId)) {
      setSelectedTeamSlots(selectedTeamSlots.filter(id => id !== charId));
    } else if (selectedTeamSlots.length < 3) {
      setSelectedTeamSlots([...selectedTeamSlots, charId]);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-black p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view your collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Your Collection
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Manage your characters and cards
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setView('characters')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'characters'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Characters ({characters.length})
          </button>
          <button
            onClick={() => setView('cards')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'cards'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Cards ({cards.length})
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        ) : view === 'characters' ? (
          <div>
            <div className="mb-6 p-4 bg-gray-900/50 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-2">Your Team ({selectedTeamSlots.length}/3)</h3>
              <p className="text-sm text-gray-400">Click on characters to add them to your battle team</p>
            </div>
            {characters.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                No characters yet. Roll to get some!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {characters.map((char) => (
                  <motion.div
                    key={char.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleTeamSlot(char.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedTeamSlots.includes(char.id)
                        ? 'ring-4 ring-purple-500'
                        : 'hover:ring-2 hover:ring-gray-600'
                    }`}
                    style={{ backgroundColor: `${RARITY_COLORS[char.rarity]}15`, border: `1px solid ${RARITY_COLORS[char.rarity]}40` }}
                  >
                    <div className="text-2xl mb-2">⚔️</div>
                    <div className="font-bold text-lg" style={{ color: RARITY_COLORS[char.rarity] }}>
                      {char.species}
                    </div>
                    <div className="text-xs text-gray-400 mb-3">#{char.tokenId}</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>HP: {char.stats?.hp || 0}</div>
                      <div>ATK: {char.stats?.attack || 0}</div>
                      <div>DEF: {char.stats?.defense || 0}</div>
                      <div>SPD: {char.stats?.speed || 0}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {cards.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                No cards yet. Roll to get some!
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                  <motion.div
                    key={card.id}
                    whileHover={{ scale: 1.03 }}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: `${RARITY_COLORS[card.rarity]}15`, border: `1px solid ${RARITY_COLORS[card.rarity]}40` }}
                  >
                    <div className="text-2xl mb-2">
                      {card.cardType === 'buff' ? '💪' : card.cardType === 'spell' ? '🔥' : card.cardType === 'ability' ? '⚡' : '🛡️'}
                    </div>
                    <div className="font-bold text-lg" style={{ color: RARITY_COLORS[card.rarity] }}>
                      {card.name}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">#{card.tokenId}</div>
                    <div className="text-sm text-gray-300 mb-2">{card.description}</div>
                    <div className="text-xs text-gray-500 capitalize">{card.cardType}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
