export type BytesValue =
  | number
  | `${number}${'' | 'K' | 'M' | 'G' | 'T'}${'' | 'i'}${'' | 'B' | 'b'}`;

const UNIT_REGEX = /^(\d+(?:\.\d+)?)\s*([KMGT]?i?[Bb]?)$/;

const FACTORS: Record<string, number> = {
  '': 1,
  b: 1,
  B: 1,
  K: 1000,
  Kb: 1000,
  KB: 2 ** 10,
  KiB: 2 ** 10,
  M: 1000_000,
  Mb: 1000_000,
  MB: 2 ** 20,
  MiB: 2 ** 20,
  G: 1000_000_000,
  Gb: 1000_000_000,
  GB: 2 ** 30,
  GiB: 2 ** 30,
  T: 1000_000_000_000,
  Tb: 1000_000_000_000,
  TB: 2 ** 40,
  TiB: 2 ** 40,
};

/**
 * Converts expressions like '5MB', '10 MiB', '1024' into number of bytes.
 */
export function parseBytes(value: BytesValue): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') throw new TypeError(`Invalid bytes value type: "${typeof value}"`);

  const match = value.replace(/[_\s]+/g, '').match(UNIT_REGEX);
  if (match == null) throw new Error(`Invalid bytes format: "${value}"`);

  const [, numStr, unit] = match;
  const num = +numStr;

  const factor = FACTORS[unit];
  if (factor == null) throw new Error(`Unknown bytes unit: "${unit}" from value: "${value}"`);

  return num * factor;
}
