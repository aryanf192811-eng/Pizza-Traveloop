const express = require('express');
const { body, query } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
  getPublicTrip,
  getAllTrips,
  createTrip,
  getTripById,
  updateTrip,
  deleteTrip,
  toggleVisibility,
} = require('../controllers/tripsController');

const router = express.Router();

// CRITICAL: /public/:id MUST be declared before /:id
router.get('/public/:id', getPublicTrip);

router.get('/', verifyToken, getAllTrips);

router.post(
  '/',
  verifyToken,
  [
    body('title').notEmpty().trim().isLength({ max: 255 }).withMessage('Title is required (max 255 chars)'),
    body('start_date').isISO8601().withMessage('Valid start_date required (ISO8601)'),
    body('end_date')
      .isISO8601()
      .withMessage('Valid end_date required (ISO8601)')
      .custom((val, { req }) => {
        if (new Date(val) < new Date(req.body.start_date)) {
          throw new Error('end_date must be >= start_date');
        }
        return true;
      }),
    body('total_budget').optional().isFloat({ min: 0 }).withMessage('total_budget must be >= 0'),
    body('status')
      .optional()
      .isIn(['upcoming', 'ongoing', 'completed'])
      .withMessage('Invalid status'),
  ],
  handleValidationErrors,
  createTrip
);

router.get('/:id', verifyToken, getTripById);
router.put('/:id', verifyToken, updateTrip);
router.delete('/:id', verifyToken, deleteTrip);
router.patch('/:id/visibility', verifyToken, toggleVisibility);

module.exports = router;
