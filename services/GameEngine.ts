import { Entity, FruitType, Particle, BladePoint, GameConfig } from '../types';
import { soundService } from './SoundService';

export class GameEngine {
  public entities: Entity[] = [];
  public particles: Particle[] = [];
  public blade: BladePoint[] = [];
  
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  
  private lastTime: number = 0;
  private spawnTimer: number = 0;
  private spawnRate: number = 1000; // ms
  private difficultyMultiplier: number = 1;

  public score: number = 0;
  public lives: number = 3;
  public isGameOver: boolean = false;
  
  private onGameOver: () => void;
  private onScoreUpdate: (score: number) => void;
  private onLivesUpdate: (lives: number) => void;

  private config: GameConfig = {
    gravity: 800, // pixels per second squared
    bladeSize: 8,
    bladeDecay: 5, // point life duration
  };

  constructor(
    onGameOver: () => void, 
    onScoreUpdate: (s: number) => void, 
    onLivesUpdate: (l: number) => void
  ) {
    this.onGameOver = onGameOver;
    this.onScoreUpdate = onScoreUpdate;
    this.onLivesUpdate = onLivesUpdate;
  }

  init(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.entities = [];
    this.particles = [];
    this.blade = [];
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.difficultyMultiplier = 1;
    this.spawnRate = 1000;
    this.lastTime = performance.now();
    
    this.onScoreUpdate(0);
    this.onLivesUpdate(3);
  }

  resize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  // Helper to get current physics scaling
  private getDifficultyScale() {
    // Scales from 1.0 upwards. E.g. 1.5 means 50% faster physics.
    return 1 + (this.difficultyMultiplier - 1) * 0.15;
  }

  private spawnFruit() {
    const types = [
      FruitType.WATERMELON, FruitType.WATERMELON,
      FruitType.ORANGE, FruitType.ORANGE,
      FruitType.APPLE, FruitType.APPLE,
      FruitType.MANGO,
      FruitType.PINEAPPLE,
      FruitType.BOMB // Less frequent
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const isBomb = type === FruitType.BOMB;
    
    // Random position at bottom (margin of 10%)
    const x = this.canvasWidth * 0.1 + Math.random() * (this.canvasWidth * 0.8);
    const y = this.canvasHeight + 50;
    
    // Throw towards center-ish
    const centerX = this.canvasWidth / 2;
    const directionX = (centerX - x) / (this.canvasWidth / 2); // -1 to 1
    
    // Calculate current gravity based on difficulty
    const speedScale = this.getDifficultyScale();
    const currentGravity = this.config.gravity * speedScale;

    // Velocity needs to be enough to reach top 20% of screen
    const minHeight = this.canvasHeight * 0.2;
    // v^2 = u^2 + 2as -> u = sqrt(-2as)
    // s is (canvasHeight - minHeight) negative because up is negative
    const targetHeight = minHeight + Math.random() * (this.canvasHeight * 0.4);
    const distanceY = (this.canvasHeight - targetHeight);
    
    // We use the boosted gravity here so they reach the same height but faster
    const vy = -Math.sqrt(2 * currentGravity * distanceY);
    
    // Horizontal speed also scales so they traverse the screen faster
    const vx = directionX * (100 + Math.random() * 200) * speedScale;

    const radius = isBomb ? 50 : 60;

    let color = '#F00';
    let innerColor = '#FFF';

    switch (type) {
      case FruitType.WATERMELON: color = '#166524'; innerColor = '#ff4d4d'; break;
      case FruitType.ORANGE: color = '#ff7f00'; innerColor = '#ffae00'; break;
      case FruitType.APPLE: color = '#cc0000'; innerColor = '#ffffe0'; break;
      case FruitType.MANGO: color = '#ffcc00'; innerColor = '#ffd700'; break;
      case FruitType.PINEAPPLE: color = '#8B4513'; innerColor = '#FFFF00'; break;
      case FruitType.BOMB: color = '#111'; innerColor = '#330000'; break;
    }

    this.entities.push({
      id: Math.random().toString(36),
      type,
      x,
      y,
      vx,
      vy,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 5 * speedScale, // Spin faster too
      radius,
      color,
      innerColor,
      isSliced: false,
      isBomb,
      scale: 1,
    });
  }

  update(time: number) {
    if (this.isGameOver) return;

    const dt = (time - this.lastTime) / 1000; // delta time in seconds
    this.lastTime = time;
    
    // Prevent huge jumps if tab was inactive
    if (dt > 0.1) return;

    // Spawning logic
    this.spawnTimer += dt * 1000;
    if (this.spawnTimer > this.spawnRate) {
      this.spawnFruit();
      
      // Occasionally spawn a second one for chaos
      // Probability increases with difficulty
      if (Math.random() > Math.max(0.3, 0.8 - (this.difficultyMultiplier * 0.05))) {
        setTimeout(() => this.spawnFruit(), 200);
      }
      
      this.spawnTimer = 0;
      
      // Increase difficulty over time
      // 0.02 per spawn -> +1.0 every 50 spawns (approx 30-40 secs)
      this.difficultyMultiplier += 0.02;
      
      // Decrease spawn rate limit (make it faster)
      // Start ~1000ms, Cap at 300ms
      this.spawnRate = Math.max(300, 1100 - (this.difficultyMultiplier * 100));
    }

    // Apply current physics scaling
    const speedScale = this.getDifficultyScale();
    const currentGravity = this.config.gravity * speedScale;

    // Update Entities
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.vy += currentGravity * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.rotation += e.rotationSpeed * dt;

      // Update trail for sliced entities
      if (e.isSliced) {
        if (!e.trail) e.trail = [];
        e.trail.push({ x: e.x, y: e.y });
        // Keep trail short (approx 10-15 frames)
        if (e.trail.length > 12) {
          e.trail.shift();
        }
      }

      // Despawn if below screen
      if (e.y > this.canvasHeight + 100) {
        if (!e.isBomb && !e.isSliced) {
          this.loseLife();
        }
        this.entities.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += currentGravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1.5; // Fade out speed

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Blade
    for (let i = this.blade.length - 1; i >= 0; i--) {
      this.blade[i].life -= dt * 5;
      if (this.blade[i].life <= 0) {
        this.blade.splice(i, 1);
      }
    }
  }

  addBladePoint(x: number, y: number) {
    this.blade.push({ x, y, life: 1 });
    
    // Check collisions with blade segment (last point to new point)
    if (this.blade.length > 1) {
      const p1 = this.blade[this.blade.length - 2];
      const p2 = this.blade[this.blade.length - 1];
      this.checkSlice(p1, p2);
    }
  }

  private checkSlice(p1: BladePoint, p2: BladePoint) {
    if (this.isGameOver) return;

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.isSliced) continue; // Already sliced

      // Line segment vs Circle collision
      const dist = this.pointLineDist(e.x, e.y, p1.x, p1.y, p2.x, p2.y);
      
      if (dist < e.radius) {
        if (e.isBomb) {
          this.triggerGameOver();
        } else {
          this.sliceFruit(i, e, p2.x - p1.x, p2.y - p1.y);
        }
      }
    }
  }

  private pointLineDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) // in case of 0 length line
        param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private sliceFruit(index: number, e: Entity, dx: number, dy: number) {
    // SFX
    soundService.playSlice();
    soundService.playSquish();

    // Logic
    this.entities.splice(index, 1);
    this.score++;
    this.onScoreUpdate(this.score);

    // Create 2 halves
    const speed = Math.sqrt(dx*dx + dy*dy);
    // Normalize blade direction
    const nx = dx / (speed || 1);
    const ny = dy / (speed || 1);
    
    // Orthogonal vector for separation
    const ox = -ny;
    const oy = nx;

    // Spawn halves
    this.createHalf(e, ox, oy, 1);
    this.createHalf(e, ox, oy, -1);

    // Spawn Particles (Juice)
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        id: Math.random().toString(),
        x: e.x,
        y: e.y,
        vx: (Math.random() - 0.5) * 400 + (ox * 100),
        vy: (Math.random() - 0.5) * 400 + (oy * 100),
        life: 1,
        color: e.innerColor,
        size: Math.random() * 5 + 2
      });
    }
  }

  private createHalf(parent: Entity, ox: number, oy: number, dir: number) {
    this.entities.push({
      ...parent,
      id: Math.random().toString(),
      isSliced: true,
      vx: parent.vx + (ox * dir * 150),
      vy: parent.vy + (oy * dir * 150),
      rotationSpeed: parent.rotationSpeed + (dir * 2),
      radius: parent.radius * 0.8, // Slightly smaller hitbox visually, though it doesn't collide anymore
      trail: [] // Initialize empty trail
    });
  }

  private loseLife() {
    if (this.isGameOver) return;
    this.lives--;
    this.onLivesUpdate(this.lives);
    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    soundService.playExplosion();
    soundService.playGameOver();
    
    // Flash white logic can be handled in draw or react component
    this.onGameOver();
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw Blade Trail
    if (this.blade.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.blade[0].x, this.blade[0].y);
      for (let i = 1; i < this.blade.length; i++) {
        ctx.lineTo(this.blade[i].x, this.blade[i].y);
      }
      // Glowing style
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = this.config.bladeSize;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Entities
    this.entities.forEach(e => {
      // Draw Juice Stream for sliced fruits (before transformation so it's world space)
      if (e.isSliced && e.trail && e.trail.length > 1) {
        const trailLength = e.trail.length;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw multiple segments for tapering effect
        for (let i = 0; i < trailLength - 1; i++) {
            const p1 = e.trail[i];
            const p2 = e.trail[i + 1];
            
            // Progress: 0 at tail, 1 at head
            const progress = i / (trailLength - 1);
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            // Taper width from 0 to radius*0.8
            ctx.lineWidth = (e.radius * 0.8) * progress; 
            ctx.strokeStyle = e.innerColor;
            
            // Fade opacity
            ctx.globalAlpha = 0.4 * progress; 
            
            ctx.stroke();
        }

        // Link last point to current
        const lastP = e.trail[trailLength - 1];
        ctx.beginPath();
        ctx.moveTo(lastP.x, lastP.y);
        ctx.lineTo(e.x, e.y);
        ctx.lineWidth = e.radius * 0.8;
        ctx.strokeStyle = e.innerColor;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        
        ctx.restore();
      }

      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rotation);

      if (e.isBomb) {
        // Bomb Body
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        // Shine
        ctx.beginPath();
        ctx.arc(-15, -15, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        // Sparking fuse
        if (!e.isSliced) {
           ctx.beginPath();
           ctx.moveTo(0, -e.radius);
           ctx.quadraticCurveTo(10, -e.radius - 10, 20, -e.radius - 5);
           ctx.strokeStyle = '#8B4513';
           ctx.lineWidth = 4;
           ctx.stroke();
           // Spark
           if (Math.random() > 0.5) {
             ctx.beginPath();
             ctx.arc(20, -e.radius - 5, 5, 0, Math.PI * 2);
             ctx.fillStyle = '#FFA500';
             ctx.fill();
           }
        }
      } else {
        // Fruit Body
        if (e.isSliced) {
          // Half fruit
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, Math.PI, 0); // Semi circle
          ctx.closePath();
          ctx.fillStyle = e.innerColor; // Inside
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = e.color; // Rind
          ctx.stroke();
        } else {
          // Whole fruit
          ctx.beginPath();
          ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
          ctx.fillStyle = e.color;
          ctx.fill();
          
          // Simple shading
          ctx.beginPath();
          ctx.arc(-e.radius/3, -e.radius/3, e.radius/4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fill();
        }
      }

      ctx.restore();
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life; // Fade out
      ctx.fill();
      ctx.restore();
    });
  }
}
