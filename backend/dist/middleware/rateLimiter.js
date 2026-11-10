"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = rateLimiter;
const ipMap = new Map();
/**
 * In-memory sliding window rate limiter
 * Allows windowMs (e.g. 60 seconds) and max requests per window
 */
function rateLimiter(maxRequests = 300, windowMs = 60 * 1000) {
    return (req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
        const now = Date.now();
        const record = ipMap.get(ip);
        if (!record || now > record.resetTime) {
            ipMap.set(ip, {
                count: 1,
                resetTime: now + windowMs
            });
            next();
            return;
        }
        if (record.count >= maxRequests) {
            res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
            res.status(429).json({
                success: false,
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`
            });
            return;
        }
        record.count++;
        next();
    };
}
