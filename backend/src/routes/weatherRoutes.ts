import { Router } from 'express';
import { WeatherController } from '../controllers/weatherController';

const router = Router();

router.get('/nearby', WeatherController.getNearby);

export default router;

