import { Router } from 'express';
import { FireController } from '../controllers/fireController';

const router = Router();

router.get('/', FireController.getFires);
router.get('/statistics', FireController.getStatistics);
router.get('/regions', FireController.getRegions);
router.get('/nearby', FireController.getNearbyFires);
router.get('/:id', FireController.getFireById);

export default router;

