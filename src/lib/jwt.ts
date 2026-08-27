import jwt from 'jsonwebtoken';
import env from './env';
import { SessionUser } from './types';

export function signSession(user: SessionUser): string {
  return jwt.sign(
    { username: user.username, name: user.name, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

export function verifySession(token: string): SessionUser {
  return jwt.verify(token, env.jwtSecret) as SessionUser;
}
