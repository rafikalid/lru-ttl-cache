import { describe, it, expect } from 'vitest';
import { parseBytes, BytesValue } from './bytes-parser';

describe('Parsing units', function () {
  it('Should return number', function () {
    const value = 17;
    expect(parseBytes(value)).toBe(value);
  });

  it('Should Throw error', function () {
    expect(parseBytes.bind(null, true as unknown as BytesValue)).toThrow();
    expect(parseBytes.bind(null, {} as unknown as BytesValue)).toThrow();
    expect(parseBytes.bind(null, 'test' as unknown as BytesValue)).toThrow();
    expect(parseBytes.bind(null, 'test' as unknown as BytesValue)).toThrow();
    expect(parseBytes.bind(null, '234Mib' as unknown as BytesValue)).toThrow();
  });

  itShouldParse('258', 258);
  itShouldParse('500K', 500_000);
  itShouldParse('25 M', 25_000_000);
  itShouldParse('25.76M', 25_760_000);
  itShouldParse('37G', 37_000_000_000);
  itShouldParse('12T', 12_000_000_000_000);

  itShouldParse('258b', 258);
  itShouldParse('500Kb', 500_000);
  itShouldParse('25Mb', 25_000_000);
  itShouldParse('25.76Mb', 25_760_000);
  itShouldParse('37Gb', 37_000_000_000);
  itShouldParse('12Tb', 12_000_000_000_000);

  itShouldParse('25 B', 25);
  itShouldParse('37KB', 37 * 2 ** 10);
  itShouldParse('25.76MB', 25.76 * 2 ** 20);
  itShouldParse('37GB', 37 * 2 ** 30);
  itShouldParse('12TB', 12 * 2 ** 40);
});

function itShouldParse(str: BytesValue, expectedValue: number) {
  it(`Should parse: ${str}`, function () {
    expect(parseBytes(str)).toBe(expectedValue);
  });
}
