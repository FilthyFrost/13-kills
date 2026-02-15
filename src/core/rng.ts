/**
 * core/rng.ts
 * 随机数抽象，支持种子（可选实现）
 */

/** 随机数生成器接口 */
export interface RNG {
  /** 返回 [0, 1) 区间的随机数 */
  next(): number;
}

/** 默认实现：使用 Math.random */
export const defaultRNG: RNG = {
  next(): number {
    return Math.random();
  },
};

/**
 * 可种子化随机数（线性同余法）
 * 预留接口，便于复现对局
 */
export class SeededRNG implements RNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
}
