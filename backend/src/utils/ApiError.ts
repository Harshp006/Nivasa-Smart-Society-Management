export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: unknown[]
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}
