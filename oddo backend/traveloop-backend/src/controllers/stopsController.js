const db = require('../config/db');

const verifyTripOwnership = async (tripId, userId) => {
  const result = await db.query(
    `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
    [tripId, userId]
  );
  return result.rows.length > 0;
};

// GET /api/trips/:tripId/stops
const getStops = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const stopsResult = await db.query(
      `SELECT s.*, COALESCE(c.name, s.custom_city) AS city_name, c.country,
              c.avg_daily_cost, c.popularity_score
       FROM trip_stops s LEFT JOIN cities c ON c.id = s.city_id
       WHERE s.trip_id=$1 ORDER BY s.stop_order ASC`,
      [tripId]
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

    return res.status(200).json({ success: true, data: stops });
  } catch (err) {
    next(err);
  }
};

// POST /api/trips/:tripId/stops
const createStop = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const orderResult = await db.query(
      `SELECT COALESCE(MAX(stop_order),0)+1 AS next_order FROM trip_stops WHERE trip_id=$1`,
      [tripId]
    );
    const stop_order = orderResult.rows[0].next_order;

    const { city_id, custom_city, start_date, end_date, section_type, budget, notes } = req.body;

    const result = await db.query(
      `INSERT INTO trip_stops (trip_id, city_id, custom_city, stop_order, start_date, end_date, section_type, budget, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        tripId,
        city_id || null,
        custom_city || null,
        stop_order,
        start_date,
        end_date,
        section_type || 'general',
        budget || 0,
        notes || null,
      ]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/trips/:tripId/stops/reorder — MUST be before /:stopId
const reorderStops = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      client.release();
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const { order } = req.body;
    if (!Array.isArray(order)) {
      client.release();
      return res.status(400).json({ success: false, error: 'order must be an array' });
    }

    await client.query('BEGIN');
    for (const item of order) {
      await client.query(
        `UPDATE trip_stops SET stop_order=$1 WHERE id=$2 AND trip_id=$3`,
        [item.stop_order, item.id, tripId]
      );
    }
    await client.query('COMMIT');
    client.release();

    return res.status(200).json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    next(err);
  }
};

// PUT /api/trips/:tripId/stops/:stopId
const updateStop = async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const stopCheck = await db.query(
      `SELECT id FROM trip_stops WHERE id=$1 AND trip_id=$2`,
      [stopId, tripId]
    );
    if (stopCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found' });
    }

    const allowed = ['city_id', 'custom_city', 'start_date', 'end_date', 'section_type', 'budget', 'notes', 'stop_order'];
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
      `UPDATE trip_stops SET ${setClause} WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, stopId]
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trips/:tripId/stops/:stopId
const deleteStop = async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const stopCheck = await db.query(
      `SELECT id FROM trip_stops WHERE id=$1 AND trip_id=$2`,
      [stopId, tripId]
    );
    if (stopCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found' });
    }

    await db.query(`DELETE FROM trip_stops WHERE id=$1`, [stopId]);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// POST /api/trips/:tripId/stops/:stopId/activities
const addActivity = async (req, res, next) => {
  try {
    const { tripId, stopId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const stopCheck = await db.query(
      `SELECT id FROM trip_stops WHERE id=$1 AND trip_id=$2`,
      [stopId, tripId]
    );
    if (stopCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found' });
    }

    const { activity_id, custom_name, scheduled_time, cost } = req.body;

    const result = await db.query(
      `INSERT INTO stop_activities (stop_id, activity_id, custom_name, scheduled_time, cost)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [stopId, activity_id || null, custom_name || null, scheduled_time || null, cost || 0]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trips/:tripId/stops/:stopId/activities/:actId
const deleteActivity = async (req, res, next) => {
  try {
    const { tripId, stopId, actId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const stopCheck = await db.query(
      `SELECT id FROM trip_stops WHERE id=$1 AND trip_id=$2`,
      [stopId, tripId]
    );
    if (stopCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Stop not found' });
    }

    const actCheck = await db.query(
      `SELECT id FROM stop_activities WHERE id=$1 AND stop_id=$2`,
      [actId, stopId]
    );
    if (actCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    await db.query(`DELETE FROM stop_activities WHERE id=$1`, [actId]);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getStops, createStop, reorderStops, updateStop, deleteStop, addActivity, deleteActivity };
