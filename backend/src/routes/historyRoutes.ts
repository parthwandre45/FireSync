import { Router } from 'express';
import { HistoryController } from '../controllers/historyController';

const router = Router();

router.get('/statistics', HistoryController.getStatistics);

export default router;

