import { parseUnit, UnitValue } from "./unit-parser";

describe("Parsing units", function () {
	it("Should return number", function () {
		const value = 17;
		expect(parseUnit(value)).toBe(value);
	});

	it("Should Throw error", function () {
		expect(parseUnit.bind(null, true as unknown as UnitValue)).toThrow();
		expect(parseUnit.bind(null, {} as unknown as UnitValue)).toThrow();
		expect(parseUnit.bind(null, "test" as unknown as UnitValue)).toThrow();
	});

	itShouldParse("258", 258);
	itShouldParse("500K", 500_000);
	itShouldParse("25M", 25_000_000);
	itShouldParse("25.76M", 25_760_000);
	itShouldParse("37G", 37_000_000_000);
	itShouldParse("12T", 12_000_000_000_000);

	itShouldParse("258 b", 258);
	itShouldParse("500Kb", 500_000);
	itShouldParse("25Mb", 25_000_000);
	itShouldParse("25.76Mb", 25_760_000);
	itShouldParse("37Gb", 37_000_000_000);
	itShouldParse("12Tb", 12_000_000_000_000);

	itShouldParse("25 B", 25);
	itShouldParse("37KB", 37 * 2 ** 10);
	itShouldParse("25.76MB", 25.76 * 2 ** 20);
	itShouldParse("37GB", 37 * 2 ** 30);
	itShouldParse("12TB", 12 * 2 ** 40);
});

function itShouldParse(str: UnitValue, value: number) {
	it(`Should parse: ${str}`, function () {
		expect(parseUnit(str)).toBe(value);
	});
}
