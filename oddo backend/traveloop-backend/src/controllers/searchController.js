const db = require('../config/db');

// GET /api/search/cities
const searchCities = async (req, res, next) => {
  try {
    const { q, region, limit } = req.query;
    const cap = Math.min(parseInt(limit) || 10, 20);

    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (region) {
      params.push(region);
      conditions.push(`region=$${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(cap);

    const result = await db.query(
      `SELECT id, name, country, region, avg_daily_cost, popularity_score, image_url
       FROM cities ${whereClause} ORDER BY popularity_score DESC LIMIT $${params.length}`,
      params
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/search/activities
const searchActivities = async (req, res, next) => {
  try {
    const { q, city_id, category, limit } = req.query;
    const cap = Math.min(parseInt(limit) || 20, 30);

    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`a.name ILIKE $${params.length}`);
    }

    if (city_id) {
      params.push(city_id);
      conditions.push(`a.city_id=$${params.length}`);
    }

    if (category) {
      params.push(category);
      conditions.push(`a.category=$${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(cap);

    const result = await db.query(
      `SELECT a.*, c.name AS city_name
       FROM activities a LEFT JOIN cities c ON c.id = a.city_id
       ${whereClause} ORDER BY a.popularity DESC LIMIT $${params.length}`,
      params
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/search/cities/popular
const getPopularCities = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM cities ORDER BY popularity_score DESC LIMIT 8`
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/search/activities/popular
const getPopularActivities = async (req, res, next) => {
  try {
    const { city_id } = req.query;

    const result = await db.query(
      `SELECT a.*, c.name AS city_name
       FROM activities a LEFT JOIN cities c ON c.id = a.city_id
       WHERE ($1::int IS NULL OR a.city_id=$1)
       ORDER BY a.popularity DESC LIMIT 10`,
      [city_id ? parseInt(city_id) : null]
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchCities, searchActivities, getPopularCities, getPopularActivities };
