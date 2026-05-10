const db = require('../config/db');

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const [usersResult, countResult] = await Promise.all([
      db.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.city, u.country,
                u.created_at, COUNT(t.id)::int AS trip_count
         FROM users u
         LEFT JOIN trips t ON t.user_id=u.id AND t.deleted_at IS NULL
         WHERE u.deleted_at IS NULL
           AND ($1='' OR (u.first_name||' '||u.last_name||' '||u.email) ILIKE '%'||$1||'%')
         GROUP BY u.id ORDER BY u.created_at DESC
         LIMIT $2 OFFSET $3`,
        [search, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total FROM users u
         WHERE u.deleted_at IS NULL
           AND ($1='' OR (u.first_name||' '||u.last_name||' '||u.email) ILIKE '%'||$1||'%')`,
        [search]
      ),
    ]);

    const total = countResult.rows[0].total;
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: usersResult.rows,
      meta: { total, page, pages },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/trips
const getTrips = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || '';

    const [tripsResult, countResult] = await Promise.all([
      db.query(
        `SELECT t.id, t.title, t.status, t.start_date, t.end_date, t.is_public, t.created_at,
                u.first_name||' '||u.last_name AS user_name, u.email,
                COUNT(DISTINCT s.id)::int AS stop_count,
                COALESCE(SUM(e.amount),0)::numeric AS total_spent
         FROM trips t
         JOIN users u ON u.id=t.user_id
         LEFT JOIN trip_stops s ON s.trip_id=t.id
         LEFT JOIN expenses e ON e.trip_id=t.id
         WHERE t.deleted_at IS NULL
           AND ($1='' OR t.status=$1)
         GROUP BY t.id, u.first_name, u.last_name, u.email
         ORDER BY t.created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total FROM trips WHERE deleted_at IS NULL AND ($1='' OR status=$1)`,
        [status]
      ),
    ]);

    const total = countResult.rows[0].total;
    const pages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: tripsResult.rows,
      meta: { total, page, pages },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsersRes,
      totalTripsRes,
      tripsByStatusRes,
      topCitiesRes,
      totalExpensesRes,
      newUsers7dRes,
      newTrips7dRes,
      communityCountRes,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE deleted_at IS NULL`),
      db.query(`SELECT COUNT(*)::int AS count FROM trips WHERE deleted_at IS NULL`),
      db.query(
        `SELECT status, COUNT(*)::int AS count FROM trips WHERE deleted_at IS NULL GROUP BY status`
      ),
      db.query(
        `SELECT COALESCE(c.name, s.custom_city) AS name, COUNT(*)::int AS trips
         FROM trip_stops s LEFT JOIN cities c ON c.id=s.city_id
         GROUP BY name ORDER BY trips DESC LIMIT 6`
      ),
      db.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM expenses`),
      db.query(
        `SELECT COUNT(*)::int AS count FROM users
         WHERE created_at >= NOW()-INTERVAL '7 days' AND deleted_at IS NULL`
      ),
      db.query(
        `SELECT COUNT(*)::int AS count FROM trips
         WHERE created_at >= NOW()-INTERVAL '7 days' AND deleted_at IS NULL`
      ),
      db.query(`SELECT COUNT(*)::int AS count FROM community_posts`),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_users: totalUsersRes.rows[0].count,
        total_trips: totalTripsRes.rows[0].count,
        trips_by_status: tripsByStatusRes.rows,
        top_cities: topCitiesRes.rows,
        total_expenses: totalExpensesRes.rows[0].total,
        new_users_7d: newUsers7dRes.rows[0].count,
        new_trips_7d: newTrips7dRes.rows[0].count,
        community_posts_count: communityCountRes.rows[0].count,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getTrips, getAnalytics };
