import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { AuthUserPayload, UserRole } from '../types';

export class AuthService {
  public static async register(data: { email: string; password: string; fullName: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        role: UserRole.REGISTERED
      }
    });

    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  public static async login(credentials: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase() }
    });

    if (!user) {
      throw new AppError('Invalid credentials supplied', 401);
    }

    const valid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid credentials supplied', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Your account has been deactivated or suspended', 403);
    }

    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        savedLocations: true,
        alertRules: true
      }
    });

    if (!user) {
      throw new AppError('User profile not found', 404);
    }

    return user;
  }
}

