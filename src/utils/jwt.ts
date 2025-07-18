import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types/interfaces';
import { logger } from './logger';

export class JwtUtils {
  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'iam-service',
      audience: 'iam-client',
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(payload: { sub: string; username: string }): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'iam-service',
      audience: 'iam-client',
    });
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'iam-service',
        audience: 'iam-client',
      }) as JwtPayload;
      
      return decoded;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token: string): { sub: string; username: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'iam-service',
        audience: 'iam-client',
      }) as { sub: string; username: string };
      
      return decoded;
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      throw error;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Failed to decode token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    
    return expiration < new Date();
  }
}