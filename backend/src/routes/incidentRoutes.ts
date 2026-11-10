import { Router } from 'express';
import { IncidentController } from '../controllers/incidentController';

const router = Router();

router.get('/', IncidentController.getIncidents);
router.get('/:id', IncidentController.getIncidentById);
router.get('/:id/observations', IncidentController.getIncidentObservations);

export default router;

