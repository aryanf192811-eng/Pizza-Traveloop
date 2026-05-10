const db = require('../config/db');

// GET /api/community (public)
const getPosts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const offset = (page - 1) * limit;

    const [postsResult, countResult] = await Promise.all([
      db.query(
        `SELECT cp.id, cp.caption, cp.created_at,
                u.first_name, u.last_name, u.photo_url,
                t.title, t.start_date, t.end_date, t.cover_photo,
                COUNT(DISTINCT s.id)::int AS stop_count,
                COUNT(DISTINCT e.id)::int AS expense_count
         FROM community_posts cp
         JOIN users u ON u.id=cp.user_id AND u.deleted_at IS NULL
         JOIN trips t ON t.id=cp.trip_id AND t.deleted_at IS NULL AND t.is_public=true
         LEFT JOIN trip_stops s ON s.trip_id=t.id
         LEFT JOIN expenses e ON e.trip_id=t.id
         GROUP BY cp.id, u.first_name, u.last_name, u.photo_url,
                  t.title, t.start_date, t.end_date, t.cover_photo
         ORDER BY cp.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      db.query(`SELECT COUNT(*)::int AS total FROM community_posts cp
                JOIN trips t ON t.id=cp.trip_id AND t.deleted_at IS NULL AND t.is_public=true`),
    ]);

    const total = countResult.rows[0].total;
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: postsResult.rows,
      meta: { total, page, pages },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/community [verifyToken]
const createPost = async (req, res, next) => {
  try {
    const { trip_id, caption } = req.body;

    const tripCheck = await db.query(
      `SELECT id, is_public FROM trips WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [trip_id, req.user.id]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (!tripCheck.rows[0].is_public) {
      return res.status(400).json({ success: false, error: 'Trip must be public to share' });
    }

    const dupCheck = await db.query(
      `SELECT id FROM community_posts WHERE trip_id=$1 AND user_id=$2`,
      [trip_id, req.user.id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Already shared' });
    }

    const insertResult = await db.query(
      `INSERT INTO community_posts (trip_id, user_id, caption) VALUES ($1, $2, $3) RETURNING *`,
      [trip_id, req.user.id, caption || null]
    );

    const post = insertResult.rows[0];

    const enriched = await db.query(
      `SELECT cp.*, u.first_name, u.last_name, u.photo_url,
              t.title, t.start_date, t.end_date, t.cover_photo
       FROM community_posts cp
       JOIN users u ON u.id=cp.user_id
       JOIN trips t ON t.id=cp.trip_id
       WHERE cp.id=$1`,
      [post.id]
    );

    return res.status(201).json({ success: true, data: enriched.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPosts, createPost };
