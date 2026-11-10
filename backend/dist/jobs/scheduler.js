"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeScheduler = initializeScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const firmsIngestionService_1 = require("../services/firmsIngestionService");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
function initializeScheduler() {
    const cronExpression = env_1.env.INGESTION_CRON || '*/15 * * * *';
    if (!node_cron_1.default.validate(cronExpression)) {
        logger_1.logger.error(`Invalid cron expression for data ingestion: ${cronExpression}`);
        return;
    }
    logger_1.logger.info(`Initializing background scheduler: Ingestion job scheduled with cron '${cronExpression}'`);
    node_cron_1.default.schedule(cronExpression, async () => {
        logger_1.logger.info('Running scheduled NASA FIRMS data ingestion task...');
        try {
            await firmsIngestionService_1.FirmsIngestionService.executeSyncJob();
            logger_1.logger.info('Scheduled NASA FIRMS ingestion completed successfully.');
        }
        catch (err) {
            logger_1.logger.error(`Error in scheduled ingestion job: ${err}`);
        }
    });
}
