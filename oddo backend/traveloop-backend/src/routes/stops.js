const express = require('express');
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
  getStops,
  createStop,
  reorderStops,
  updateStop,
  deleteStop,
  addActivity,
  deleteActivity,
} = require('../controllers/stopsController');

// mergeParams: true so :tripId from parent route is accessible
const router = express.Router({ mergeParams: true });

router.get('/', verifyToken, getStops);

router.post(
  '/',
  verifyToken,
  [
    body('start_date').isISO8601().withMessage('Valid start_date required'),
    body('end_date')
      .isISO8601()
      .withMessage('Valid end_date required')
      .custom((val, { req }) => {
        if (new Date(val) < new Date(req.body.start_date)) {
          throw new Error('end_date must be >= start_date');
        }
        return true;
      }),
    body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be >= 0'),
    body('section_type')
      .optional()
      .isIn(['travel', 'hotel', 'activity', 'general'])
      .withMessage('Invalid section_type'),
    body().custom((val) => {
      if (!val.city_id && !val.custom_city) {
        throw new Error('Either city_id or custom_city must be provided');
      }
      return true;
    }),
  ],
  handleValidationErrors,
  createStop
);

// CRITICAL: reorder MUST be before /:stopId
router.patch('/reorder', verifyToken, reorderStops);

router.put('/:stopId', verifyToken, updateStop);
router.delete('/:stopId', verifyToken, deleteStop);

router.post(
  '/:stopId/activities',
  verifyToken,
  [
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be >= 0'),
    body('activity_id').optional().isInt().withMessage('activity_id must be an integer'),
    body('custom_name').optional(),
  ],
  handleValidationErrors,
  addActivity
);

router.delete('/:stopId/activities/:actId', verifyToken, deleteActivity);

module.exports = router;
