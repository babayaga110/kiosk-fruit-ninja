import React from 'react';
import { Heart, Play, RefreshCw, Trophy } from 'lucide-react';

interface UIOverlayProps {
  gameState: 'MENU' | 'PLAYING' | 'GAME_OVER';
  score: number;
  lives: number;
  onStart: () => void;
  onRestart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, score, lives, onStart, onRestart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
      {/* HUD - Always visible during play/gameover mostly */}
      <div className="flex justify-between items-start w-full">
        {/* Score */}
        <div className="flex items-center gap-4">
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border-2 border-white/10 shadow-2xl">
                 <div className="flex items-center gap-2 text-yellow-400">
                    <Trophy size={48} fill="#facc15" />
                    <span className="text-6xl font-black tracking-wider drop-shadow-lg font-mono">{score}</span>
                 </div>
                 <div className="text-white/60 text-sm font-bold tracking-widest uppercase pl-2">Score</div>
            </div>
        </div>

        {/* Lives */}
        {gameState === 'PLAYING' && (
             <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <Heart 
                        key={i} 
                        size={48} 
                        className={`transition-all duration-300 ${i < lives ? 'fill-red-500 text-red-600' : 'fill-gray-700 text-gray-800 scale-90'}`}
                    />
                ))}
             </div>
        )}
      </div>

      {/* Center Modals - Wrapper is pointer-events-none to pass clicks to game, children re-enable it */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        
        {/* Main Menu */}
        {gameState === 'MENU' && (
            <div className="text-center animate-in fade-in zoom-in duration-300 pointer-events-auto">
                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 drop-shadow-lg mb-8"
                    style={{ WebkitTextStroke: '2px white' }}>
                    FRUIT SLICE
                </h1>
                <p className="text-white text-2xl mb-12 opacity-80">Swipe to slice. Don't hit the bombs!</p>
                
                <button 
                    onClick={onStart}
                    className="group relative bg-gradient-to-br from-orange-500 to-red-600 text-white text-4xl font-bold py-8 px-20 rounded-full shadow-[0_0_40px_rgba(255,100,0,0.5)] hover:scale-105 active:scale-95 transition-transform duration-200 border-4 border-white/20"
                >
                    <div className="flex items-center gap-4">
                        <Play size={40} fill="currentColor" />
                        <span>TAP TO START</span>
                    </div>
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-full bg-white/20 translate-y-1/2 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        )}

        {/* Game Over */}
        {gameState === 'GAME_OVER' && (
            <div className="text-center bg-black/60 backdrop-blur-xl p-16 rounded-[3rem] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 max-w-2xl w-full pointer-events-auto">
                <h2 className="text-7xl font-black text-red-500 mb-2 drop-shadow-md">GAME OVER</h2>
                <div className="text-white/70 text-2xl font-medium mb-8">Better luck next time!</div>
                
                <div className="bg-white/5 rounded-2xl p-8 mb-10 border border-white/5">
                    <div className="text-white/50 uppercase tracking-widest text-sm font-bold mb-2">Final Score</div>
                    <div className="text-8xl font-black text-white">{score}</div>
                </div>

                <button 
                    onClick={onRestart}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl font-bold py-6 px-12 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    <RefreshCw size={32} />
                    <span>PLAY AGAIN</span>
                </button>
                
                <div className="mt-8 text-white/30 text-lg animate-pulse">
                    Auto-restarting in 10s...
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UIOverlay;