/**
 * core/rng.ts
 * 随机数抽象，支持种子（可选实现）
 * 使用 PCG32 算法，达到商业卡牌网游级别的随机质量
 */

/** 随机数生成器接口 */
export interface RNG {
  /** 返回 [0, 1) 区间的随机数 */
  next(): number;
  /** 可选：返回 [min, max] 区间的无偏差随机整数，未实现时由调用方回退 */
  nextIntInclusive?(min: number, max: number): number;
}

/** PCG32 乘数常量 (6364136223846793005 的低 32 位和高 32 位) */
const PCG_MUL_LO = 0x4c957f2d;
const PCG_MUL_HI = 0x5851f42d;

/** 默认增量常量 (用于多流) */
const DEFAULT_INC_LO = 0xf767814f | 1;
const DEFAULT_INC_HI = 0x14057b7e;

/** 53 位精度常量，用于生成 [0,1) 双精度浮点 */
const BIT_53 = 9007199254740992;
const BIT_27 = 134217728;

function add64(
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number
): [number, number] {
  const aL = aLo >>> 0;
  const aH = aHi >>> 0;
  const bL = bLo >>> 0;
  const bH = bHi >>> 0;
  const lo = (aL + bL) >>> 0;
  const carry = lo < aL ? 1 : 0;
  const hi = (aH + bH + carry) >>> 0;
  return [lo, hi];
}

function mul64(
  aLo: number,
  aHi: number,
  bLo: number,
  bHi: number
): [number, number] {
  const aL = aLo >>> 0;
  const aH = aHi >>> 0;
  const bL = bLo >>> 0;
  const bH = bHi >>> 0;

  const aLH = (aL >>> 16) & 0xffff;
  const aLL = aL & 0xffff;
  const bLH = (bL >>> 16) & 0xffff;
  const bLL = bL & 0xffff;

  const aLHxbLL = (aLH * bLL) >>> 0;
  const aLLxbLH = (aLL * bLH) >>> 0;
  const aLHxbLH = (aLH * bLH) >>> 0;
  const aLLxbLL = (aLL * bLL) >>> 0;

  const l0 = (aLHxbLL + aLLxbLH) >>> 0;
  const c0 = l0 < aLHxbLL ? 1 : 0;
  const h0 = (aLHxbLH + c0) >>> 0;

  const aLxbH = Math.imul(aL, bH) >>> 0;
  const aHxbL = Math.imul(aH, bL) >>> 0;

  const resLo = (l0 + aLLxbLL) >>> 0;
  const c1 = resLo < aLLxbLL ? 1 : 0;
  const resHi = (aLxbH + aHxbL + h0 + c1) >>> 0;

  return [resLo, resHi];
}

/**
 * PCG32 随机数生成器
 * 基于 Permuted Congruential Generator，统计质量优秀，支持种子与可复现
 */
export class PCGRNG implements RNG {
  private stateLo = 0;
  private stateHi = 0;
  private incLo = DEFAULT_INC_LO;
  private incHi = DEFAULT_INC_HI;

  /**
   * @param seedLo 可选，32 位种子低部分
   * @param seedHi 可选，32 位种子高部分；若仅传 seedLo 则 seedHi=0
   */
  constructor(seedLo?: number, seedHi?: number) {
    if (seedLo !== undefined) {
      this.setSeed(seedLo >>> 0, (seedHi ?? 0) >>> 0);
    } else {
      this.seedFromEntropy();
    }
  }

  private seedFromEntropy(): void {
    let sl: number;
    let sh: number;
    try {
      const buf = new Uint32Array(2);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(buf);
        sl = buf[0];
        sh = buf[1];
      } else {
        sl = (Math.random() * 0xffffffff) >>> 0;
        sh = (Math.random() * 0xffffffff) >>> 0;
      }
    } catch {
      sl = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
      sh = (Date.now() * 0x10001 ^ (Math.random() * 0xffffffff)) >>> 0;
    }
    this.setSeed(sl, sh);
  }

  private setSeed(seedLo: number, seedHi: number): void {
    this.stateLo = 0;
    this.stateHi = 0;
    this.next32();
    const [lo, hi] = add64(
      this.stateLo,
      this.stateHi,
      seedLo,
      seedHi
    );
    this.stateLo = lo;
    this.stateHi = hi;
    this.next32();
  }

  /** 生成 [0, 0xFFFFFFFF] 的 32 位随机整数 */
  private next32(): number {
    const oldLo = this.stateLo >>> 0;
    const oldHi = this.stateHi >>> 0;

    const [mulLo, mulHi] = mul64(oldLo, oldHi, PCG_MUL_LO, PCG_MUL_HI);
    const [newLo, newHi] = add64(mulLo, mulHi, this.incLo, this.incHi);
    this.stateLo = newLo;
    this.stateHi = newHi;

    const xsHi = oldHi >>> 18;
    const xsLo = ((oldLo >>> 18) | (oldHi << 14)) >>> 0;
    const xsLo2 = (xsLo ^ oldLo) >>> 0;
    const xsHi2 = (xsHi ^ oldHi) >>> 0;
    const xorshifted = ((xsLo2 >>> 27) | (xsHi2 << 5)) >>> 0;
    const rot = oldHi >>> 27;
    const rot2 = ((-rot >>> 0) & 31) >>> 0;
    return ((xorshifted >>> rot) | (xorshifted << rot2)) >>> 0;
  }

  next(): number {
    const hi = (this.next32() & 0x03ffffff) * 1;
    const lo = (this.next32() & 0x07ffffff) * 1;
    return ((hi * BIT_27) + lo) / BIT_53;
  }

  /** 无偏差返回 [min, max]  inclusive 的随机整数 */
  nextIntInclusive(min: number, max: number): number {
    const range = max - min + 1;
    if (range <= 0) return min;

    const umax = range >>> 0;
    if ((umax & (umax - 1)) === 0) {
      return min + (this.next32() & (umax - 1));
    }
    const threshold = ((-umax >>> 0) % umax) >>> 0;
    let num: number;
    do {
      num = this.next32();
    } while (num < threshold);
    return min + (num % umax);
  }
}

/** 创建默认 RNG 实例（每局独立种子） */
export function createDefaultRNG(seed?: number): RNG {
  if (seed !== undefined) {
    return new PCGRNG(seed, 0);
  }
  return new PCGRNG();
}

/** 兼容旧 API：单例 PCG 实例，新建对局请使用 createDefaultRNG() */
export const defaultRNG: RNG = createDefaultRNG();

/**
 * 可种子化随机数（委托给 PCGRNG）
 * 便于复现对局、调试
 */
export class SeededRNG implements RNG {
  private readonly pcg: PCGRNG;

  constructor(seed: number) {
    this.pcg = new PCGRNG(seed >>> 0, 0);
  }

  next(): number {
    return this.pcg.next();
  }

  nextIntInclusive(min: number, max: number): number {
    return this.pcg.nextIntInclusive(min, max);
  }
}
