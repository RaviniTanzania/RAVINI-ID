import bcrypt from 'bcryptjs';

/**
 * RAVINI V2 Server Password Security
 * Enforces bcrypt hashing for all stored credentials.
 * Plaintext passwords are NEVER stored in the database or sent over API responses.
 */

const SALT_ROUNDS = 10;

export function hashPassword(password: string): string {
  if (!password) return '';
  if (isHashed(password)) {
    return password;
  }
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(candidate: string, storedHashOrPlain?: string): boolean {
  if (!candidate || !storedHashOrPlain) return false;
  
  if (isHashed(storedHashOrPlain)) {
    try {
      return bcrypt.compareSync(candidate, storedHashOrPlain);
    } catch {
      return false;
    }
  }

  // Legacy plaintext fallback for seamless in-flight account migration
  return candidate === storedHashOrPlain;
}

export function isHashed(str?: string): boolean {
  if (!str) return false;
  return str.startsWith('$2a$') || str.startsWith('$2b$') || str.startsWith('$2y$');
}

export function sanitizeUser<T extends { password?: string; passwordHash?: string }>(user: T): Omit<T, 'password' | 'passwordHash'> {
  const copy: any = { ...user };
  delete copy.password;
  delete copy.passwordHash;
  return copy;
}
