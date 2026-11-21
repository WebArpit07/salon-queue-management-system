/**
 * Middleware to require and validate staff PIN from x-staff-pin header
 */
export const requireStaffPin = (req, res, next) => {
  const staffPin = process.env.STAFF_PIN || '1234';
  const providedPin = req.headers['x-staff-pin'];

  if (!providedPin || String(providedPin).trim() !== String(staffPin).trim()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid staff PIN required',
    });
  }

  next();
};

export default requireStaffPin;
