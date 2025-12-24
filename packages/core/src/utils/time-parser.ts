/**
 * Parses time expressions and returns milliseconds
 * Supports: ms, s, m, h, d
 * Examples: "5s", "2d 5h 4m 5s 23ms"
 */
export function parseTimeExpression(expression: string | number): number {
  if(typeof expression === 'number') return expression;
  if(typeof expression !== 'string') {
    throw new Error(`Invalid time expression type: ${typeof expression}`);
  }

  let totalMs = 0;
  const regex = /(\d+(?:\.\d+)?)\s*([a-z]+)/gi;
  let match;

  while ((match = regex.exec(expression)) !== null) {
    const value = +match[1];
    const unit = match[2].toLowerCase();

    switch(unit) {
      case 'ms':
        totalMs += value;
        break;
      case 's':
        totalMs += value * 1000;
        break;
      case 'min':
        totalMs += value * 60 * 1000;
        break;
      case 'h':
        totalMs += value * 60 * 60 * 1000;
        break;
      case 'd':
        totalMs += value * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unknown time unit: "${unit}" from expression: "${expression}"`);
    }
  }

  if (totalMs === 0) {
    throw new Error(`Invalid time expression: "${expression}"`);
  }

  return totalMs;
}