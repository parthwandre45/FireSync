import { Router } from 'express';
import { SystemController } from '../controllers/systemController';

const router = Router();

router.get('/health', SystemController.getHealth);
router.get('/data-sources', SystemController.getDataSources);
router.get('/ingestion-status', SystemController.getIngestionStatus);
router.post('/trigger-ingestion', SystemController.triggerIngestion);

export default router;

