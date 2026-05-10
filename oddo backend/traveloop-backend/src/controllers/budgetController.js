const db = require('../config/db');

const verifyTripOwnership = async (tripId, userId) => {
  const result = await db.query(
    `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
    [tripId, userId]
  );
  return result.rows.length > 0;
};

// GET /api/trips/:tripId/budget
const getBudget = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const [totalSpentRes, byCategoryRes, totalBudgetRes, byStopRes] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(amount),0)::numeric AS total_spent FROM expenses WHERE trip_id=$1`,
        [tripId]
      ),
      db.query(
        `SELECT category, COALESCE(SUM(amount),0)::numeric AS amount
         FROM expenses WHERE trip_id=$1 GROUP BY category ORDER BY amount DESC`,
        [tripId]
      ),
      db.query(`SELECT total_budget FROM trips WHERE id=$1`, [tripId]),
      db.query(
        `SELECT s.id, COALESCE(c.name, s.custom_city) AS city_name, s.budget,
                COALESCE(SUM(e.amount),0)::numeric AS spent
         FROM trip_stops s
         LEFT JOIN expenses e ON e.stop_id = s.id
         LEFT JOIN cities c ON c.id = s.city_id
         WHERE s.trip_id=$1
         GROUP BY s.id, c.name, s.custom_city, s.budget
         ORDER BY s.stop_order`,
        [tripId]
      ),
    ]);

    const total_budget = Number(totalBudgetRes.rows[0].total_budget);
    const total_spent = Number(totalSpentRes.rows[0].total_spent);
    const remaining = total_budget - total_spent;
    const is_over_budget = total_spent > total_budget;

    return res.status(200).json({
      success: true,
      data: {
        total_budget,
        total_spent,
        remaining,
        is_over_budget,
        by_category: byCategoryRes.rows,
        by_stop: byStopRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/trips/:tripId/budget/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const result = await db.query(
      `SELECT * FROM expenses WHERE trip_id=$1 ORDER BY expense_date DESC, created_at DESC`,
      [tripId]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/trips/:tripId/budget/expenses
const addExpense = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const { amount, category, description, stop_id, currency, expense_date } = req.body;

    const result = await db.query(
      `INSERT INTO expenses (trip_id, stop_id, category, description, amount, currency, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tripId, stop_id || null, category, description, amount, currency || 'INR', expense_date || null]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trips/:tripId/budget/expenses/:expId
const deleteExpense = async (req, res, next) => {
  try {
    const { tripId, expId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const expCheck = await db.query(
      `SELECT id FROM expenses WHERE id=$1 AND trip_id=$2`,
      [expId, tripId]
    );
    if (expCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    await db.query(`DELETE FROM expenses WHERE id=$1`, [expId]);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getBudget, getExpenses, addExpense, deleteExpense };
