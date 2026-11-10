import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import fireRoutes from './fireRoutes';
import incidentRoutes from './incidentRoutes';
import satelliteRoutes from './satelliteRoutes';
import historyRoutes from './historyRoutes';
import weatherRoutes from './weatherRoutes';
import userRoutes from './userRoutes';
import systemRoutes from './systemRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/fires', fireRoutes);
router.use('/incidents', incidentRoutes);
router.use('/satellites', satelliteRoutes);
router.use('/history', historyRoutes);
router.use('/weather', weatherRoutes);
router.use('/users', userRoutes);
router.use('/system', systemRoutes);

export default router;

