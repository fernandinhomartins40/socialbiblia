import { ApiResponse, PaginatedResponse } from '../types/api';

export class ResponseUtil {
  private static generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static success<T>(
    data: T,
    message?: string,
    meta?: Partial<ApiResponse<T>['meta']>
  ): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateId(),
        ...meta,
      },
    };

    if (message) {
      response.message = message;
    }

    return response;
  }

  static error(
    error: string,
    message?: string,
    meta?: Partial<ApiResponse['meta']>
  ): ApiResponse {
    const response: ApiResponse = {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateId(),
        ...meta,
      },
    };

    if (message) {
      response.message = message;
    }

    return response;
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        timestamp: new Date().toISOString(),
        requestId: this.generateId(),
      },
    };
  }

  static validation(errors: Array<{ field: string; message: string }>): ApiResponse {
    return {
      success: false,
      error: 'Validation failed',
      message: 'Por favor, corrija os erros de validação',
      data: { errors },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateId(),
      },
    };
  }
}
