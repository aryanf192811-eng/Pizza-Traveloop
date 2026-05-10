const db = require('../config/db');

// GET /api/trips/public/:id
const getPublicTrip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tripResult = await db.query(
      `SELECT * FROM trips WHERE id=$1 AND is_public=true AND deleted_at IS NULL`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];

    const stopsResult = await db.query(
      `SELECT s.*, COALESCE(c.name, s.custom_city) AS city_name
       FROM trip_stops s LEFT JOIN cities c ON c.id = s.city_id
       WHERE s.trip_id=$1 ORDER BY s.stop_order ASC`,
      [trip.id]
    );

    const stops = await Promise.all(
      stopsResult.rows.map(async (stop) => {
        const actResult = await db.query(
          `SELECT sa.*, COALESCE(a.name, sa.custom_name) AS name, a.category, a.estimated_cost
           FROM stop_activities sa LEFT JOIN activities a ON a.id = sa.activity_id
           WHERE sa.stop_id=$1`,
          [stop.id]
        );
        return { ...stop, activities: actResult.rows };
      })
    );

    return res.status(200).json({ success: true, data: { ...trip, stops } });
  } catch (err) {
    next(err);
  }
};

// GET /api/trips
const getAllTrips = async (req, res, next) => {
  try {
    const { status, search, sort } = req.query;
    const allowedSorts = ['start_date', 'created_at', 'title'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';

    const params = [req.user.id];
    let whereExtra = '';

    if (status) {
      params.push(status);
      whereExtra += ` AND t.status=$${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereExtra += ` AND t.title ILIKE $${params.length}`;
    }

    const result = await db.query(
      `SELECT t.*,
              e.total_spent,
              s.stop_count
       FROM trips t
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(amount),0) AS total_spent FROM expenses WHERE trip_id=t.id
       ) e ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS stop_count FROM trip_stops WHERE trip_id=t.id
       ) s ON true
       WHERE t.user_id=$1 AND t.deleted_at IS NULL${whereExtra}
       ORDER BY t.${sortCol} DESC`,
      params
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/trips
const createTrip = async (req, res, next) => {
  try {
    const { title, description, start_date, end_date, total_budget, status, is_public } = req.body;

    const result = await db.query(
      `INSERT INTO trips (user_id, title, description, start_date, end_date, total_budget, status, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        title,
        description || null,
        start_date,
        end_date,
        total_budget || 0,
        status || 'upcoming',
        is_public || false,
      ]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/trips/:id
const getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ownerCheck = await db.query(
      `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [id, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const tripResult = await db.query(`SELECT * FROM trips WHERE id=$1`, [id]);
    const trip = tripResult.rows[0];

    const stopsResult = await db.query(
      `SELECT s.*, COALESCE(c.name, s.custom_city) AS city_name, c.country, c.avg_daily_cost
       FROM trip_stops s LEFT JOIN cities c ON c.id = s.city_id
       WHERE s.trip_id=$1 ORDER BY s.stop_order ASC`,
      [trip.id]
    );

    const stops = await Promise.all(
      stopsResult.rows.map(async (stop) => {
        const actResult = await db.query(
          `SELECT sa.*, COALESCE(a.name, sa.custom_name) AS name, a.category, a.estimated_cost
           FROM stop_activities sa LEFT JOIN activities a ON a.id = sa.activity_id
           WHERE sa.stop_id=$1`,
          [stop.id]
        );
        return { ...stop, activities: actResult.rows };
      })
    );

    return res.status(200).json({ success: true, data: { ...trip, stops } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/trips/:id
const updateTrip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ownerCheck = await db.query(
      `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [id, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const allowed = ['title', 'description', 'start_date', 'end_date', 'total_budget', 'status', 'is_public'];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');

    const result = await db.query(
      `UPDATE trips SET ${setClause} WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trips/:id
const deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ownerCheck = await db.query(
      `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [id, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    await db.query(`UPDATE trips SET deleted_at=NOW() WHERE id=$1`, [id]);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// PATCH /api/trips/:id/visibility
const toggleVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ownerCheck = await db.query(
      `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [id, req.user.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const result = await db.query(
      `UPDATE trips SET is_public = NOT is_public WHERE id=$1 RETURNING is_public`,
      [id]
    );

    return res.status(200).json({ success: true, data: { is_public: result.rows[0].is_public } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPublicTrip, getAllTrips, createTrip, getTripById, updateTrip, deleteTrip, toggleVisibility };
