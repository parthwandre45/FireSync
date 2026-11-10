"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatelliteController = void 0;
const satelliteService_1 = require("../services/satelliteService");
class SatelliteController {
    static async getSatellites(req, res, next) {
        try {
            const missions = await satelliteService_1.SatelliteService.listMissions();
            res.json({
                success: true,
                data: missions
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getSatelliteByCode(req, res, next) {
        try {
            const mission = await satelliteService_1.SatelliteService.getMissionByCode(req.params.code);
            res.json({
                success: true,
                data: mission
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getImageryLayers(req, res, next) {
        try {
            const layers = await satelliteService_1.SatelliteService.listImageryLayers();
            res.json({
                success: true,
                data: layers
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SatelliteController = SatelliteController;
