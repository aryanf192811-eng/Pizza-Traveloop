const db = require('../config/db');

const verifyTripOwnership = async (tripId, userId) => {
  const result = await db.query(
    `SELECT id FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
    [tripId, userId]
  );
  return result.rows.length > 0;
};

// GET /api/trips/:tripId/notes
const getNotes = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { stop_id } = req.query;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const params = [tripId];
    let extraWhere = '';
    if (stop_id) {
      params.push(stop_id);
      extraWhere = ` AND n.stop_id=$${params.length}`;
    }

    const result = await db.query(
      `SELECT n.*, COALESCE(c.name, s.custom_city) AS stop_name
       FROM trip_notes n
       LEFT JOIN trip_stops s ON s.id = n.stop_id
       LEFT JOIN cities c ON c.id = s.city_id
       WHERE n.trip_id=$1${extraWhere}
       ORDER BY n.updated_at DESC`,
      params
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/trips/:tripId/notes
const createNote = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const { content, stop_id } = req.body;

    const result = await db.query(
      `INSERT INTO trip_notes (trip_id, stop_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [tripId, stop_id || null, content.trim()]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/trips/:tripId/notes/:noteId
const updateNote = async (req, res, next) => {
  try {
    const { tripId, noteId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const noteCheck = await db.query(
      `SELECT id FROM trip_notes WHERE id=$1 AND trip_id=$2`,
      [noteId, tripId]
    );
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const { content } = req.body;
    const result = await db.query(
      `UPDATE trip_notes SET content=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [content.trim(), noteId]
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trips/:tripId/notes/:noteId
const deleteNote = async (req, res, next) => {
  try {
    const { tripId, noteId } = req.params;

    const owned = await verifyTripOwnership(tripId, req.user.id);
    if (!owned) {
      return res.status(404).json({ success: false, error: 'Trip not found or access denied' });
    }

    const noteCheck = await db.query(
      `SELECT id FROM trip_notes WHERE id=$1 AND trip_id=$2`,
      [noteId, tripId]
    );
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    await db.query(`DELETE FROM trip_notes WHERE id=$1`, [noteId]);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
