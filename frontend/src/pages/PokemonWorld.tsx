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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border-4 border-white p-6 shadow-[8px_8px_0px_rgba(0,0,0,0.8)] max-w-md w-full text-center z-50 font-pixel">
          <div className="border-b-2 border-white pb-4 mb-4">
              <h2 className="text-xl font-bold text-yellow-400 uppercase tracking-widest text-shadow-sm mb-1">{nearbyDojo.name}</h2>
              <p className="text-[10px] text-gray-500 font-mono">LOCATION FOUND</p>
          </div>
          
          <div className="mb-8">
              <p className="text-white text-xs leading-relaxed mb-4">
                A Pokémon battle is about to begin! <br />
                Do you want to enter and place a bet?
              </p>
              <div className="w-16 h-1 bg-white mx-auto animate-pulse"></div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setNearbyDojo(null)}
              className="px-6 py-3 bg-[#333] text-white text-xs border-2 border-white shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none hover:bg-[#444] uppercase transition-none"
            >
              RUN AWAY
            </button>
            <button
              onClick={handleJoinDojo}
              className="px-6 py-3 bg-blue-600 text-white text-xs border-2 border-white shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none hover:bg-blue-500 uppercase transition-none animate-pulse"
            >
              ENTER DOJO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PokemonWorld;
