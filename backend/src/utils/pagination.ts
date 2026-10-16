export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function getPaginationParams(query: any): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function successResponse<T>(
  res: any,
  data: T,
  message = 'Success',
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function paginatedResponse<T>(
  res: any,
  data: T[],
  meta: PaginationMeta,
  message = 'Success'
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
}
