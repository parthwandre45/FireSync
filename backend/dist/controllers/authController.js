"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await authService_1.AuthService.register(req.body);
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await authService_1.AuthService.login(req.body);
            res.cookie('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async logout(req, res) {
        res.clearCookie('token');
        res.json({
            success: true,
            message: 'Successfully logged out'
        });
    }
    static async me(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const profile = await authService_1.AuthService.getProfile(req.user.userId);
            res.json({
                success: true,
                data: profile
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
