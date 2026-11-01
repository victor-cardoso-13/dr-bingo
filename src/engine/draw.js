import { cryptoRandomInt } from './rng.js';

export const BALL_MAX = 60;
export const MAIN_BALLS = 30;
export const MAX_EXTRA = 10;

// Fisher–Yates sobre 1..max.
export function shuffleRange(max, randomInt = cryptoRandomInt) {
  const balls = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = balls.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  return balls;
}

export const shuffleBalls = (randomInt = cryptoRandomInt) => shuffleRange(BALL_MAX, randomInt);
