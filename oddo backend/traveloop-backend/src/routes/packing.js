const express = require('express');
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
  getPackingItems,
  addItem,
  bulkAddItems,
  resetPacking,
  toggleItem,
  deleteItem,
} = require('../controllers/packingController');

const router = express.Router({ mergeParams: true });

router.get('/', verifyToken, getPackingItems);

router.post(
  '/',
  verifyToken,
  [
    body('item_name').notEmpty().trim().isLength({ max: 255 }).withMessage('item_name required (max 255)'),
    body('category').optional().trim().isLength({ max: 80 }).withMessage('category max 80 chars'),
  ],
  handleValidationErrors,
  addItem
);

// bulk and reset MUST be before /:itemId
router.post('/bulk', verifyToken, bulkAddItems);
router.post('/reset', verifyToken, resetPacking);

router.patch('/:itemId/toggle', verifyToken, toggleItem);
router.delete('/:itemId', verifyToken, deleteItem);

module.exports = router;
