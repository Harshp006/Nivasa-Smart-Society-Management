import { describe, it, expect } from 'vitest';
import { getPaginationParams, buildPaginationMeta } from '../src/utils/pagination';

describe('Pagination Utilities', () => {
  it('should parse default pagination parameters', () => {
    const params = getPaginationParams({});
    expect(params.page).toBe(1);
    expect(params.limit).toBe(20);
    expect(params.skip).toBe(0);
    expect(params.take).toBe(20);
  });

  it('should respect custom page and limit', () => {
    const params = getPaginationParams({ page: '3', limit: '25' });
    expect(params.page).toBe(3);
    expect(params.limit).toBe(25);
    expect(params.skip).toBe(50);
    expect(params.take).toBe(25);
  });

  it('should cap limit to maximum 100', () => {
    const params = getPaginationParams({ limit: '500' });
    expect(params.limit).toBe(100);
  });

  it('should construct correct pagination metadata', () => {
    const meta = buildPaginationMeta(95, 2, 10);
    expect(meta.total).toBe(95);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(10);
    expect(meta.totalPages).toBe(10);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });

  it('should handle single page metadata correctly', () => {
    const meta = buildPaginationMeta(5, 1, 10);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });
});
