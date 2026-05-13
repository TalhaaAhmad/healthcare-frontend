export class FrappeAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public frappeError?: any
  ) {
    super(message);
    this.name = 'FrappeAPIError';
  }
}

export function handleFrappeError(error: any): FrappeAPIError {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        return new FrappeAPIError(
          'Session expired. Please login again.',
          401,
          data
        );
      case 403:
        return new FrappeAPIError(
          data.message || 'You do not have permission to perform this action.',
          403,
          data
        );
      case 404:
        return new FrappeAPIError(
          'The requested record was not found.',
          404,
          data
        );
      case 417:
        return new FrappeAPIError(
          data.message || 'Validation failed. Please check your input.',
          417,
          data
        );
      default:
        return new FrappeAPIError(
          'An unexpected error occurred. Please try again.',
          status,
          data
        );
    }
  }

  return new FrappeAPIError(
    'Network error. Please check your connection.',
    0,
    error
  );
}
