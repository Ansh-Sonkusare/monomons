import { useEffect, useRef } from 'react';
import { GameEngine } from './engine/GameEngine';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = new GameEngine(canvasRef.current);
    gameRef.current = game;
    game.start();

    return () => {
      game.stop();
    };
  }, []);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} />
      <div className="game-title">
        <h1>🌍 Pokemon World</h1>
        <p>Explore the infinite islands!</p>
      </div>
    </div>
  );
}

export default App;
