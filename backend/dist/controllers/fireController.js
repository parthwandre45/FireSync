"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireController = void 0;
const fireService_1 = require("../services/fireService");
class FireController {
    static async getFires(req, res, next) {
        try {
            const q = req.query;
            const params = {
                minLat: q.minLat !== undefined ? parseFloat(q.minLat) : undefined,
                maxLat: q.maxLat !== undefined ? parseFloat(q.maxLat) : undefined,
                minLon: q.minLon !== undefined ? parseFloat(q.minLon) : undefined,
                maxLon: q.maxLon !== undefined ? parseFloat(q.maxLon) : undefined,
                confidence: q.confidence !== undefined ? parseFloat(q.confidence) : undefined,
                minFrp: q.minFrp !== undefined ? parseFloat(q.minFrp) : undefined,
                sensor: q.sensor,
                satellite: q.satellite,
                dayNight: q.dayNight,
                timeRange: q.timeRange,
                limit: q.limit ? parseInt(q.limit, 10) : 500,
                offset: q.offset ? parseInt(q.offset, 10) : 0,
                sortBy: q.sortBy,
                sortOrder: q.sortOrder
            };
            const result = await fireService_1.FireService.queryFires(params);
            res.json({
                success: true,
                data: result.items,
                meta: {
                    total: result.total,
                    limit: params.limit,
                    offset: params.offset,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getFireById(req, res, next) {
        try {
            const fire = await fireService_1.FireService.getById(req.params.id);
            if (!fire) {
                res.status(404).json({ success: false, error: 'Fire observation not found' });
                return;
            }
            res.json({ success: true, data: fire });
        }
        catch (err) {
            next(err);
        }
    }
    static async getNearbyFires(req, res, next) {
        try {
            const lat = parseFloat(req.query.lat);
            const lon = parseFloat(req.query.lon);
            const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm) : 100;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            if (isNaN(lat) || isNaN(lon)) {
                res.status(400).json({ success: false, error: 'Valid lat and lon query parameters are required' });
                return;
            }
            const fires = await fireService_1.FireService.findNearby(lat, lon, radiusKm, limit);
            res.json({ success: true, data: fires });
        }
        catch (err) {
            next(err);
        }
    }
    static async getRegions(req, res, next) {
        try {
            const regions = await fireService_1.FireService.getRegionalActivity();
            res.json({ success: true, data: regions });
        }
        catch (err) {
            next(err);
        }
    }
    static async getStatistics(req, res, next) {
        try {
            const overview = await fireService_1.FireService.getDashboardOverview();
            res.json({ success: true, data: overview });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FireController = FireController;
