import { describe, it, expect } from 'vitest';
import { parseTimeExpression } from './time-parser';

describe('parseTimeExpression', () => {
  it('should parse milliseconds', () => {
    expect(parseTimeExpression('100ms')).toBe(100);
  });

  it('should parse seconds', () => {
    expect(parseTimeExpression('5s')).toBe(5000);
  });

  it('should parse minutes', () => {
    expect(parseTimeExpression('2min')).toBe(120000);
  });

  it('should parse hours', () => {
    expect(parseTimeExpression('1h')).toBe(3600000);
  });

  it('should parse days', () => {
    expect(parseTimeExpression('1d')).toBe(86400000);
  });

  it('should parse decimal values', () => {
    expect(parseTimeExpression('1.5s')).toBe(1500);
  });

  it('should parse combined expressions', () => {
    expect(parseTimeExpression('2d 5h 4min 5s 23ms')).toBe((2*86400 + 5*3600 + 4*60 + 5) * 1000 + 23);
  });

  it('should handle whitespace variations', () => {
    expect(parseTimeExpression('5s 10ms')).toBe(5010);
  });

  it('should be case insensitive', () => {
    expect(parseTimeExpression('5S')).toBe(5000);
    expect(parseTimeExpression('2MIN')).toBe(120000);
  });

  it('should pass through numeric input', () => {
    expect(parseTimeExpression(5000)).toBe(5000);
  });

  it('should throw on invalid unit', () => {
    expect(() => parseTimeExpression('5x')).toThrow('Unknown time unit: "x" from expression: "5x"');
  });

  it('should throw on empty expression', () => {
    expect(() => parseTimeExpression('')).toThrow('Invalid time expression');
  });

  it('should throw on invalid type', () => {
    expect(() => parseTimeExpression(null as unknown as string)).toThrow('Invalid time expression type');
  });

  it('should throw on only whitespace', () => {
    expect(() => parseTimeExpression('   ')).toThrow('Invalid time expression');
  });
});