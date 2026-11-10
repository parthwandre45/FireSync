"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryController = void 0;
const historyService_1 = require("../services/historyService");
class HistoryController {
    static async getStatistics(req, res, next) {
        try {
            const region = req.query.region;
            const periodType = req.query.periodType;
            const stats = await historyService_1.HistoryService.getHistoricalStatistics(region, periodType);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.HistoryController = HistoryController;
