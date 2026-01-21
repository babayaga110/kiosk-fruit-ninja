import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../services/GameEngine';

interface GameCanvasProps {
  engine: GameEngine;
  isActive: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ engine, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Input Handling Helpers
  const handleInput = (clientX: number, clientY: number) => {
    if (!isActive || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    engine.addBladePoint(x, y);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Resize logic
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
            canvas.width = entry.contentRect.width;
            canvas.height = entry.contentRect.height;
            engine.resize(canvas.width, canvas.height);
        }
      }
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Animation Loop
    let animationFrameId: number;
    const render = (time: number) => {
      if (isActive) {
        engine.update(time);
        engine.draw(ctx);
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render(performance.now());

    // Event Listeners
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      for (let i = 0; i < e.touches.length; i++) {
        handleInput(e.touches[i].clientX, e.touches[i].clientY);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
       handleInput(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) { // Left click held
        handleInput(e.clientX, e.clientY);
      }
    };
    
    // Bind events non-passively for touch-action prevention
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchstart', onTouchMove, { passive: false }); 
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchMove);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, engine]);

  return (
    <div ref={containerRef} className="w-full h-full absolute top-0 left-0 overflow-hidden bg-slate-900">
        {/* Background Dojo Pattern Simulation */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{backgroundImage: 'radial-gradient(circle at center, #333 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
        
        <canvas 
            ref={canvasRef} 
            className="block w-full h-full touch-none select-none"
        />
    </div>
  );
};

export default GameCanvas;