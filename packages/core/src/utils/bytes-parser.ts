export type BytesValue =
	| number
	| `${number}${'' | 'K' | 'M' | 'G' | 'T'}${''|'i'}${'' | 'B' | 'b'}`;

const UNIT_REGEX = /^(\d+(?:\.\d+)?)\s*([KMGT]?i?[Bb]?)$/;

/**
 * Converts expressions like '5MB', '10 MiB', '1024' into number of bytes.
 */
export function parseBytes(value: BytesValue): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') throw new Error(`Invalid bytes value type: ${typeof value}`);

  const match = value.replace(/[_\s]+/g, '').match(UNIT_REGEX);
  if (match == null)
    throw new Error(`Invalid bytes format: ${value}`);

  const [, numStr, unit] = match;
  let result = +numStr;

  switch(unit) {
    case '':
		case 'b':
		case 'B':
			break;

		case 'K':
		case 'Kb':
		case 'KiB':
			result *= 1000;
			break;
		case 'KB':
			result *= 2 ** 10;
			break;

		case 'M':
		case 'Mb':
		case 'MiB':
			result *= 1000_000;
			break;
		case 'MB':
			result *= 2 ** 20;
			break;

		case 'G':
		case 'Gb':
		case 'GiB':
			result *= 1000_000_000;
			break;
		case 'GB':
			result *= 2 ** 30;
			break;

		case 'T':
		case 'Tb':
		case 'TiB':
			result *= 1000_000_000_000;
			break;
		case 'TB':
			result *= 2 ** 40;
			break;

		default:
			throw new Error(`Unrecognized expression: ${value}`);
  }

  return result;
}