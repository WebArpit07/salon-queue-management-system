import { Router } from 'express';

const router = Router();

/**
 * POST /api/auth/verify-pin
 * Validates staff authentication PIN
 */
router.post('/verify-pin', (req, res) => {
  const { pin } = req.body || {};
  const staffPin = process.env.STAFF_PIN || '1234';

  if (!pin) {
    return res.status(400).json({
      valid: false,
      message: 'PIN is required',
    });
  }

  if (String(pin).trim() === String(staffPin).trim()) {
    return res.status(200).json({
      valid: true,
      message: 'Staff PIN authenticated successfully',
    });
  }

  return res.status(401).json({
    valid: false,
    message: 'Invalid staff PIN',
  });
});

export default router;
