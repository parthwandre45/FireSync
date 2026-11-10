import { Router } from 'express';
import { SatelliteController } from '../controllers/satelliteController';

const router = Router();

router.get('/', SatelliteController.getSatellites);
router.get('/imagery', SatelliteController.getImageryLayers);
router.get('/:code', SatelliteController.getSatelliteByCode);

export default router;

