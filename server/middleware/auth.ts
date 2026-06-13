import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '../config/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};
