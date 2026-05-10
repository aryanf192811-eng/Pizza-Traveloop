const express = require('express');
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const { getBudget, getExpenses, addExpense, deleteExpense } = require('../controllers/budgetController');

const router = express.Router({ mergeParams: true });

// GET /api/trips/:tripId/budget
router.get('/', verifyToken, getBudget);

// GET /api/trips/:tripId/budget/expenses
router.get('/expenses', verifyToken, getExpenses);

// POST /api/trips/:tripId/budget/expenses
router.post(
  '/expenses',
  verifyToken,
  [
    body('amount').isFloat({ gt: 0 }).withMessage('amount must be > 0'),
    body('category')
      .isIn(['transport', 'stay', 'activities', 'meals', 'misc'])
      .withMessage('Invalid category'),
    body('description').notEmpty().isLength({ max: 255 }).withMessage('description required (max 255)'),
    body('expense_date').optional().isISO8601().withMessage('Invalid expense_date'),
  ],
  handleValidationErrors,
  addExpense
);

// DELETE /api/trips/:tripId/budget/expenses/:expId
router.delete('/expenses/:expId', verifyToken, deleteExpense);

module.exports = router;
