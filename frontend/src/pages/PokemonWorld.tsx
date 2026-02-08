import { useEffect, useRef } from 'react';
import { GameEngine } from './pokemon/engine/GameEngine';
import { useAuth } from '../contexts/AuthContext';

function PokemonWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameEngine | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new GameEngine(canvasRef.current, token || undefined);
    gameRef.current = game;
    game.start();

    return () => {
      game.stop();
    };
  }, [token]);

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1e3c72] to-[#2a5298]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export default PokemonWorld;
