import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameEngine } from './pokemon/engine/GameEngine';
import { useAuth } from '../contexts/AuthContext';

function PokemonWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [nearbyDojo, setNearbyDojo] = useState<{ name: string; roomId: string } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new GameEngine(canvasRef.current, token || undefined);
    gameRef.current = game;

    game.setInteractionCallback((dojo) => {
      setNearbyDojo(dojo);
    });

    game.start();

    return () => {
      game.stop();
    };
  }, [token]);

  const handleJoinDojo = () => {
    if (nearbyDojo) {
      // Navigate to the dojo room
      // Structure: /pokemon-world/[dojo-name]/[room-id]
      // Replace spaces in name with dashes
      const slugName = nearbyDojo.name.replace(/\s+/g, '-').toLowerCase();
      navigate(`/pokemon-world/${slugName}/${nearbyDojo.roomId}`);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1e3c72] to-[#2a5298]">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {nearbyDojo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-8 rounded-xl border border-white/20 backdrop-blur-md shadow-2xl max-w-md w-full text-center z-50 animate-in fade-in zoom-in duration-200">
          <h2 className="text-2xl font-bold mb-2 text-yellow-400">{nearbyDojo.name}</h2>
          <p className="mb-6 text-gray-300">
            A Pokémon battle is about to begin! <br />
            Do you want to enter and place a bet?
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setNearbyDojo(null)}
              className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors font-semibold"
            >
              No, leave
            </button>
            <button
              onClick={handleJoinDojo}
              className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black transition-colors font-bold shadow-lg shadow-yellow-500/20"
            >
              Yes, Enter!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PokemonWorld;
