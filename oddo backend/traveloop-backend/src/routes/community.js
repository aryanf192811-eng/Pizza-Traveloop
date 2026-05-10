const express = require('express');
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { getPosts, createPost } = require('../controllers/communityController');

const router = express.Router();

router.get('/', getPosts);

router.post(
  '/',
  verifyToken,
  [
    body('trip_id').isInt().withMessage('trip_id must be an integer'),
    body('caption').optional().isLength({ max: 500 }).withMessage('caption max 500 chars'),
  ],
  handleValidationErrors,
  createPost
);

module.exports = router;
