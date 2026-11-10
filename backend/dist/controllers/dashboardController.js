"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const fireService_1 = require("../services/fireService");
class DashboardController {
    static async getOverview(req, res, next) {
        try {
            const data = await fireService_1.FireService.getDashboardOverview();
            res.json({
                success: true,
                data
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getStatistics(req, res, next) {
        try {
            const overview = await fireService_1.FireService.getDashboardOverview();
            const regional = await fireService_1.FireService.getRegionalActivity();
            res.json({
                success: true,
                data: {
                    overview,
                    topRegions: regional.slice(0, 5),
                    meta: {
                        telemetrySync: 'NOMINAL',
                        sensorPlatforms: ['Terra MODIS', 'Aqua MODIS', 'Suomi-NPP VIIRS', 'NOAA-20 VIIRS']
                    }
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getTrends(req, res, next) {
        try {
            const trends = await fireService_1.FireService.getDiurnalTrends();
            res.json({
                success: true,
                data: trends
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getRegionalActivity(req, res, next) {
        try {
            const activity = await fireService_1.FireService.getRegionalActivity();
            res.json({
                success: true,
                data: activity
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getSensorComparison(req, res, next) {
        try {
            const all = await fireService_1.FireService.queryFires({ limit: 2000 });
            const viirs = all.items.filter((i) => i.sensorFamily === 'VIIRS');
            const modis = all.items.filter((i) => i.sensorFamily === 'MODIS');
            const avgViirsFrp = viirs.length > 0 ? Math.round(viirs.reduce((s, x) => s + x.frp, 0) / viirs.length) : 0;
            const avgModisFrp = modis.length > 0 ? Math.round(modis.reduce((s, x) => s + x.frp, 0) / modis.length) : 0;
            res.json({
                success: true,
                data: {
                    viirs: {
                        observationCount: viirs.length,
                        avgFrp: avgViirsFrp,
                        spatialResolution: '375m I-Band',
                        dayNightRatio: '65% / 35%',
                        plumePenetration: 'Superior'
                    },
                    modis: {
                        observationCount: modis.length,
                        avgFrp: avgModisFrp,
                        spatialResolution: '1km Multi-spectral',
                        dayNightRatio: '58% / 42%',
                        legacyBaseline: '24+ Years Long-Term Climate Archive'
                    }
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DashboardController = DashboardController;
