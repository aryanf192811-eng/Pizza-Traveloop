const express = require('express');
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { register, login, getMe, updateProfile, upload } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('first_name').notEmpty().trim().withMessage('First name is required'),
    body('last_name').notEmpty().trim().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  ],
  handleValidationErrors,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

// GET /api/auth/me
router.get('/me', verifyToken, getMe);

// PUT /api/auth/profile
router.put('/profile', verifyToken, upload.single('photo'), updateProfile);

module.exports = router;
