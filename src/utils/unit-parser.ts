/**
 * Max value
 */
export type UnitValue =
	| number
	| `${number}${"" | "K" | "M" | "G" | "T"}${"" | "B" | "b"}`;

const UNIT_REGIX = /^\s*([\d_.]+)\s*([KMGT]?[Bb]?)\s*$/;

/**
 * Parse cache.max value as string
 */
export function parseUnit(value: UnitValue | number): number {
	if (typeof value === "number") return value;
	if (typeof value !== "string") throw new Error("Expected string");
	const rx = value.match(UNIT_REGIX);
	if (rx == null) throw new Error(`Fail to parse: ${value}`);
	let result = Number(rx[1].replaceAll("_", ""));
	switch (rx[2]) {
		case "":
		case "b":
		case "B":
			break;
		case "K":
		case "Kb":
			result *= 1000;
			break;
		case "M":
		case "Mb":
			result *= 1000_000;
			break;
		case "G":
		case "Gb":
			result *= 1000_000_000;
			break;
		case "T":
		case "Tb":
			result *= 1000_000_000_000;
			break;

		case "KB":
			result *= 2 ** 10;
			break;
		case "MB":
			result *= 2 ** 20;
			break;
		case "GB":
			result *= 2 ** 30;
			break;
		case "TB":
			result *= 2 ** 40;
			break;
		default:
			throw new Error(`Unexpected value: ${value}`);
	}
	return result;
}
