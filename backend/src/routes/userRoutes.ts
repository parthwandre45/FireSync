import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Protect all user routes
router.use(authenticate, requireAuth);

const savedLocationSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(1000).optional()
});

const alertRuleSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(1).max(1000).optional(),
  alertType: z.string().optional(),
  threshold: z.number().optional(),
  enabled: z.boolean().optional()
});

// Saved Locations
router.get('/saved-locations', UserController.getSavedLocations);
router.post('/saved-locations', validateRequest({ body: savedLocationSchema }), UserController.createSavedLocation);
router.delete('/saved-locations/:id', UserController.deleteSavedLocation);

// Alert Rules
router.get('/alerts', UserController.getAlertRules);
router.post('/alerts', validateRequest({ body: alertRuleSchema }), UserController.createAlertRule);
router.put('/alerts/:id', UserController.updateAlertRule);
router.delete('/alerts/:id', UserController.deleteAlertRule);

export default router;

