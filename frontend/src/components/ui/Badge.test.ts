import { describe, it, expect } from 'vitest';

describe('UI Badges & Formatting', () => {
  it('should correctly format status strings with underscores into spaces', () => {
    const rawStatus = 'CHECKED_IN';
    const formatted = rawStatus.replace(/_/g, ' ');
    expect(formatted).toBe('CHECKED IN');
  });

  it('should format multi-word statuses properly', () => {
    const rawStatus = 'PARTIALLY_PAID';
    const formatted = rawStatus.replace(/_/g, ' ');
    expect(formatted).toBe('PARTIALLY PAID');
  });

  it('should compute collection percentage cleanly', () => {
    const billed = 10000;
    const paid = 7500;
    const rate = Math.round((paid / billed) * 100);
    expect(rate).toBe(75);
  });
});
