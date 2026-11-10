"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        next();
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        // Expired or invalid token
        next(new errorHandler_1.AppError('Invalid or expired authentication token', 401));
    }
}
function requireAuth(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication Required',
            message: 'You must be signed in to perform this operation'
        });
        return;
    }
    next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Authentication Required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Insufficient administrative privileges'
            });
            return;
        }
        next();
    };
}
