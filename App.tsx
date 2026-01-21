import { useState, useEffect, useMemo, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameEngine } from './services/GameEngine';
import { soundService } from './services/SoundService';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  // Idle Timer Ref
  const idleTimerRef = useRef<number | null>(null);

  // Initialize Engine once
  const engine = useMemo(() => new GameEngine(
    () => setGameState('GAME_OVER'), // onGameOver
    (s) => setScore(s),              // onScore
    (l) => setLives(l)               // onLives
  ), []);

  const startGame = () => {
    soundService.resume(); // Ensure AudioContext is running
    engine.init(window.innerWidth, window.innerHeight);
    setGameState('PLAYING');
    setScore(0);
    setLives(3);
  };

  const restartGame = () => {
    startGame();
  };

  // Kiosk Mode: Auto Restart on Idle
  useEffect(() => {
    if (gameState === 'GAME_OVER') {
      idleTimerRef.current = window.setTimeout(() => {
        setGameState('MENU'); // Go back to menu or restart directly
      }, 10000);
    } else {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [gameState]);

  // Global Input Handler to reset idle timer if touched anywhere in Game Over
  const handleInteraction = () => {
    if (gameState === 'GAME_OVER' && idleTimerRef.current) {
       // Optional: Reset timer if user is interacting but hasn't clicked restart yet
       // For now, let's keep it simple: 10s hard limit or button click.
       // Actually, requirements say "Auto restart after 10s idle". 
       // If user touches screen, it implies activity.
       clearTimeout(idleTimerRef.current);
       idleTimerRef.current = window.setTimeout(() => setGameState('MENU'), 10000);
    }
  };

  return (
    <div 
        className="w-full h-screen bg-black overflow-hidden select-none touch-none relative font-sans"
        onPointerDown={handleInteraction}
        onContextMenu={(e) => e.preventDefault()} // No right click
    >
      <GameCanvas engine={engine} isActive={gameState === 'PLAYING'} />
      <UIOverlay 
        gameState={gameState} 
        score={score} 
        lives={lives} 
        onStart={startGame}
        onRestart={restartGame}
      />
    </div>
  );
}

export default App;