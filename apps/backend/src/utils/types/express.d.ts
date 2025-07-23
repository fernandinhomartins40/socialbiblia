import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      isVerified?: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: Express.User;
}

export interface ServiceResponse<T = any> {
  httpStatusCode: number;
  data: {
    success: boolean;
    message?: string;
    content?: T;
    error?: string;
  };
}