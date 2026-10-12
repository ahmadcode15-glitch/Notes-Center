import { Request } from 'express';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'DISABLED';

export interface AuthenticatedUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  maxDevices: number;
  accessExpiry: Date | null;
}

export interface AuthenticatedSession {
  id: string;
  userId: string;
  deviceIdentifier: string;
  deviceName: string;
  expiresAt: Date;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  sessionRecord?: AuthenticatedSession;
}

