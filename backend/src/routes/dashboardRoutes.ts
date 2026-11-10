import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';

const router = Router();

router.get('/overview', DashboardController.getOverview);
router.get('/statistics', DashboardController.getStatistics);
router.get('/trends', DashboardController.getTrends);
router.get('/regional-activity', DashboardController.getRegionalActivity);
router.get('/sensor-comparison', DashboardController.getSensorComparison);

export default router;

