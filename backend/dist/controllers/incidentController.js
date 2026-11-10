"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentController = void 0;
const incidentService_1 = require("../services/incidentService");
class IncidentController {
    static async getIncidents(req, res, next) {
        try {
            const q = req.query;
            const params = {
                status: q.status,
                minLat: q.minLat !== undefined ? parseFloat(q.minLat) : undefined,
                maxLat: q.maxLat !== undefined ? parseFloat(q.maxLat) : undefined,
                minLon: q.minLon !== undefined ? parseFloat(q.minLon) : undefined,
                maxLon: q.maxLon !== undefined ? parseFloat(q.maxLon) : undefined,
                limit: q.limit ? parseInt(q.limit, 10) : 100,
                offset: q.offset ? parseInt(q.offset, 10) : 0
            };
            const result = await incidentService_1.IncidentService.listIncidents(params);
            res.json({
                success: true,
                data: result.items,
                meta: {
                    total: result.total,
                    limit: params.limit,
                    offset: params.offset
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getIncidentById(req, res, next) {
        try {
            const incident = await incidentService_1.IncidentService.getIncidentById(req.params.id);
            res.json({
                success: true,
                data: incident
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getIncidentObservations(req, res, next) {
        try {
            const incident = await incidentService_1.IncidentService.getIncidentById(req.params.id);
            res.json({
                success: true,
                data: incident.observations
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.IncidentController = IncidentController;
