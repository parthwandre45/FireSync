"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const prisma_1 = require("../db/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class UserController {
    // Saved Locations
    static async getSavedLocations(req, res, next) {
        try {
            const locations = await prisma_1.prisma.savedLocation.findMany({
                where: { userId: req.user.userId },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: locations });
        }
        catch (err) {
            next(err);
        }
    }
    static async createSavedLocation(req, res, next) {
        try {
            const { name, latitude, longitude, radiusKm } = req.body;
            const location = await prisma_1.prisma.savedLocation.create({
                data: {
                    userId: req.user.userId,
                    name,
                    latitude,
                    longitude,
                    radiusKm: radiusKm || 50
                }
            });
            res.status(201).json({ success: true, data: location });
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteSavedLocation(req, res, next) {
        try {
            const { id } = req.params;
            const loc = await prisma_1.prisma.savedLocation.findUnique({ where: { id } });
            if (!loc || loc.userId !== req.user.userId) {
                throw new errorHandler_1.AppError('Saved location not found', 404);
            }
            await prisma_1.prisma.savedLocation.delete({ where: { id } });
            res.json({ success: true, message: 'Saved location deleted' });
        }
        catch (err) {
            next(err);
        }
    }
    // Alert Rules
    static async getAlertRules(req, res, next) {
        try {
            const alerts = await prisma_1.prisma.alertRule.findMany({
                where: { userId: req.user.userId },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: alerts });
        }
        catch (err) {
            next(err);
        }
    }
    static async createAlertRule(req, res, next) {
        try {
            const { name, latitude, longitude, radiusKm, alertType, threshold, enabled } = req.body;
            const alert = await prisma_1.prisma.alertRule.create({
                data: {
                    userId: req.user.userId,
                    name,
                    latitude,
                    longitude,
                    radiusKm: radiusKm || 50,
                    alertType: alertType || 'PROXIMITY',
                    threshold,
                    enabled: enabled !== undefined ? enabled : true
                }
            });
            res.status(201).json({ success: true, data: alert });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateAlertRule(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await prisma_1.prisma.alertRule.findUnique({ where: { id } });
            if (!existing || existing.userId !== req.user.userId) {
                throw new errorHandler_1.AppError('Alert rule not found', 404);
            }
            const updated = await prisma_1.prisma.alertRule.update({
                where: { id },
                data: req.body
            });
            res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteAlertRule(req, res, next) {
        try {
            const { id } = req.params;
            const existing = await prisma_1.prisma.alertRule.findUnique({ where: { id } });
            if (!existing || existing.userId !== req.user.userId) {
                throw new errorHandler_1.AppError('Alert rule not found', 404);
            }
            await prisma_1.prisma.alertRule.delete({ where: { id } });
            res.json({ success: true, message: 'Alert rule deleted' });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
