export type Vector2 = {
  x: number;
  y: number;
};

export enum FruitType {
  WATERMELON = 'WATERMELON',
  ORANGE = 'ORANGE',
  APPLE = 'APPLE',
  MANGO = 'MANGO',
  PINEAPPLE = 'PINEAPPLE',
  BOMB = 'BOMB',
}

export interface Entity {
  id: string;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  color: string;
  innerColor: string;
  isSliced: boolean;
  isBomb: boolean;
  scale: number;
  trail?: { x: number; y: number }[];
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export interface BladePoint {
  x: number;
  y: number;
  life: number; // 0 to 1
}

export interface GameConfig {
  gravity: number;
  bladeSize: number;
  bladeDecay: number;
}
