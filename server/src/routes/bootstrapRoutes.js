import { Router } from 'express';
import { SalonConfig, Barber, Service } from '../models/index.js';
import { evaluateOnlineJoiningStatus } from '../utils/salonTime.js';

const router = Router();

/**
 * GET /api/bootstrap
 * Returns the foundational salon configuration, active barbers, services catalog,
 * dynamic online joining status, and current server time.
 */
router.get('/bootstrap', async (req, res) => {
  try {
    const salonConfig = (await SalonConfig.findOne({ key: 'default' })) || (await SalonConfig.create({}));
    const barbers = await Barber.find({ onDuty: true }).sort({ name: 1 });
    const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, nameEn: 1 });

    const onlineStatus = evaluateOnlineJoiningStatus(salonConfig);

    res.status(200).json({
      salonConfig,
      barbers,
      services,
      onlineStatus,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Bootstrap Error]:', error);
    res.status(500).json({
      error: 'Failed to fetch salon bootstrap state',
      details: error.message,
    });
  }
});

export default router;
