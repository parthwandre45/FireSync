"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../db/prisma");
const env_1 = require("../config/env");
const errorHandler_1 = require("../middleware/errorHandler");
const types_1 = require("../types");
class AuthService {
    static async register(data) {
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
        if (existing) {
            throw new errorHandler_1.AppError('An account with this email already exists', 409);
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                passwordHash,
                fullName: data.fullName,
                role: types_1.UserRole.REGISTERED
            }
        });
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: '7d' });
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
    static async login(credentials) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
        });
        if (!user) {
            throw new errorHandler_1.AppError('Invalid credentials supplied', 401);
        }
        const valid = await bcryptjs_1.default.compare(credentials.password, user.passwordHash);
        if (!valid) {
            throw new errorHandler_1.AppError('Invalid credentials supplied', 401);
        }
        if (user.status !== 'ACTIVE') {
            throw new errorHandler_1.AppError('Your account has been deactivated or suspended', 403);
        }
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: '7d' });
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
    static async getProfile(userId) {
        const user = await prisma_1.prisma.user.findUnique({
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
            throw new errorHandler_1.AppError('User profile not found', 404);
        }
        return user;
    }
}
exports.AuthService = AuthService;
