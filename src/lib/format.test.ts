import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats positive numbers as USD', () => {
    expect(formatPrice(10)).toBe('$10.00');
    expect(formatPrice(19.99)).toBe('$19.99');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('handles large numbers', () => {
    expect(formatPrice(1000)).toBe('$1,000.00');
    expect(formatPrice(1234567.89)).toBe('$1,234,567.89');
  });
});
