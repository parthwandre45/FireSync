"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentService = void 0;
const prisma_1 = require("../db/prisma");
const fireService_1 = require("./fireService");
const errorHandler_1 = require("../middleware/errorHandler");
class IncidentService {
    static async listIncidents(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.minLat !== undefined && params.maxLat !== undefined) {
            where.latitude = { gte: params.minLat, lte: params.maxLat };
        }
        if (params.minLon !== undefined && params.maxLon !== undefined) {
            where.longitude = { gte: params.minLon, lte: params.maxLon };
        }
        const limit = Math.min(params.limit || 100, 500);
        const offset = params.offset || 0;
        const [incidents, total] = await Promise.all([
            prisma_1.prisma.fireIncident.findMany({
                where,
                orderBy: { peakFrp: 'desc' },
                skip: offset,
                take: limit
            }),
            prisma_1.prisma.fireIncident.count({ where })
        ]);
        const items = incidents.map((inc) => ({
            id: inc.id,
            name: inc.name,
            centroidLat: inc.latitude,
            centroidLon: inc.longitude,
            firstObservedAt: inc.firstObservedAt.toISOString(),
            lastObservedAt: inc.lastObservedAt.toISOString(),
            status: inc.status,
            observationCount: inc.observationCount,
            peakFrp: inc.peakFrp || 0,
            totalFrp: inc.totalFrp || 0,
            region: inc.region,
            estimatedPerimeter: inc.estimatedPerimeter
        }));
        return { items, total };
    }
    static async getIncidentById(id) {
        const inc = await prisma_1.prisma.fireIncident.findUnique({
            where: { id },
            include: {
                observations: {
                    orderBy: { frp: 'desc' }
                }
            }
        });
        if (!inc) {
            throw new errorHandler_1.AppError('Fire incident cluster not found', 404);
        }
        return {
            id: inc.id,
            name: inc.name,
            centroidLat: inc.latitude,
            centroidLon: inc.longitude,
            firstObservedAt: inc.firstObservedAt.toISOString(),
            lastObservedAt: inc.lastObservedAt.toISOString(),
            status: inc.status,
            observationCount: inc.observationCount,
            peakFrp: inc.peakFrp || 0,
            totalFrp: inc.totalFrp || 0,
            region: inc.region,
            estimatedPerimeter: inc.estimatedPerimeter,
            observations: inc.observations.map(fireService_1.FireService.enrichObservation)
        };
    }
}
exports.IncidentService = IncidentService;
