"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = require("../config/logger");
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
        return;
    }
    if (err instanceof AppError) {
        if (!err.isOperational) {
            logger_1.logger.error(`Critical AppError: ${err.message}`, { stack: err.stack, path: req.path });
        }
        res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
        return;
    }
    // Unhandled / server errors
    logger_1.logger.error(`Unhandled Error on ${req.method} ${req.path}: ${err.message}`, { stack: err.stack });
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
}
