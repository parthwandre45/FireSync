"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherController = void 0;
const weatherService_1 = require("../services/weatherService");
class WeatherController {
    static async getNearby(req, res, next) {
        try {
            const lat = parseFloat(req.query.lat);
            const lon = parseFloat(req.query.lon);
            if (isNaN(lat) || isNaN(lon)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid lat and lon query parameters are required'
                });
                return;
            }
            const weather = await weatherService_1.WeatherService.getNearbyWeather(lat, lon);
            res.json({
                success: true,
                data: weather
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.WeatherController = WeatherController;
