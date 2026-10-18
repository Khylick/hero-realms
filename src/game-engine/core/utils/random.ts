export interface RandomGenerator {
    next(): number;
    getState(): number;
}

export function createSeededRandom(
    seed: number,
): RandomGenerator {
    let state = seed >>> 0;

    return {
        next(): number {
            state = (state + 0x6d2b79f5) >>> 0;

            let value = state;

            value = Math.imul(
                value ^ (value >>> 15),
                value | 1,
            );

            value ^= value +
                Math.imul(
                    value ^ (value >>> 7),
                    value | 61,
                );

            return (
                (value ^ (value >>> 14)) >>> 0
            ) / 4294967296;
        },
        getState(): number {
            return state;
        },
    };
}

export function shuffle<T>(
  items: readonly T[],
  random: RandomGenerator,
): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}