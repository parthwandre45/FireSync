"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const prisma_1 = require("../db/prisma");
class HistoryService {
    static async getHistoricalStatistics(region, periodType) {
        const where = {};
        if (region && region !== 'all') {
            where.region = { contains: region, mode: 'insensitive' };
        }
        if (periodType) {
            where.periodType = periodType;
        }
        const records = await prisma_1.prisma.historicalFireStatistics.findMany({
            where,
            orderBy: { startDate: 'asc' }
        });
        return records.map((r) => ({
            id: r.id,
            region: r.region,
            periodType: r.periodType,
            startDate: r.startDate.toISOString(),
            endDate: r.endDate.toISOString(),
            observationCount: r.observationCount,
            averageFrp: r.averageFrp,
            peakFrp: r.peakFrp,
            source: r.source,
            aggregatedAt: r.aggregatedAt.toISOString()
        }));
    }
}
exports.HistoryService = HistoryService;
