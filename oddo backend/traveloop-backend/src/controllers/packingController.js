const db = require('../config/db');

const verifyTripOwnership = async (tripId, userId) => {
  const result = await db.query(
    `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
    [tripId, userId]
  );
  return result.rows.length > 0;
};

// GET /api/trips/:tripId/packing
const getPackingItems = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const result = await db.query(
      `SELECT * FROM packing_items WHERE trip_id=$1 ORDER BY category, created_at ASC`,
      [tripId]
    );

    const items = result.rows;
    const total = items.length;
    const packed_count = items.filter((r) => r.is_packed).length;

    return res.status(200).json({ success: true, data: { items, total, packed_count } });
  } catch (err) {
    next(err);
  }
};

// POST /api/trips/:tripId/packing
const addItem = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const { item_name, category } = req.body;

    const result = await db.query(
      `INSERT INTO packing_items (trip_id, item_name, category, ai_generated)
       VALUES ($1, $2, $3, false) RETURNING *`,
      [tripId, item_name.trim(), (category || 'General').trim()]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/trips/:tripId/packing/bulk
const bulkAddItems = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      client.release();
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const { items } = req.body;
    if (!Array.isArray(items) || items.length < 1 || items.length > 50) {
      client.release();
      return res.status(400).json({ success: false, error: 'items must be an array of 1-50 elements' });
    }

    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        `INSERT INTO packing_items (trip_id, item_name, category, ai_generated)
         VALUES ($1, $2, $3, true)`,
        [tripId, item.item_name, item.category || 'General']
      );
    }
    await client.query('COMMIT');
    client.release();

    return res.status(201).json({ success: true, data: { inserted: items.length } });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    next(err);
  }
};

// POST /api/trips/:tripId/packing/reset
const resetPacking = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    await db.query(`UPDATE packing_items SET is_packed=false WHERE trip_id=$1`, [tripId]);
    return res.status(200).json({ success: true, data: { message: 'All items marked unpacked' } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/trips/:tripId/packing/:itemId/toggle
const toggleItem = async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const itemCheck = await db.query(
      `SELECT id FROM packing_items WHERE id=$1 AND trip_id=$2`,
      [itemId, tripId]
    );
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const result = await db.query(
      `UPDATE packing_items SET is_packed = NOT is_packed WHERE id=$1 RETURNING *`,
      [itemId]
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trips/:tripId/packing/:itemId
const deleteItem = async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const itemCheck = await db.query(
      `SELECT id FROM packing_items WHERE id=$1 AND trip_id=$2`,
      [itemId, tripId]
    );
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    await db.query(`DELETE FROM packing_items WHERE id=$1`, [itemId]);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getPackingItems, addItem, bulkAddItems, resetPacking, toggleItem, deleteItem };
