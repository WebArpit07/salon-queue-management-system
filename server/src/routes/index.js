import { Router } from 'express';
import bootstrapRoutes from './bootstrapRoutes.js';
import authRoutes from './authRoutes.js';
import queueRoutes from './queueRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Mount sub-routers
router.use('/', bootstrapRoutes);
router.use('/auth', authRoutes);
router.use('/queue', queueRoutes);
router.use('/admin', adminRoutes);

export default router;
