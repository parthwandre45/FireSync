import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate, requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/register', validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, requireAuth, AuthController.me);

export default router;

