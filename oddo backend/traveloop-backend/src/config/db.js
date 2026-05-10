const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.message);
});

const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 500) {
    console.warn(`[SLOW SQL >500ms] ${duration}ms — ${text}`);
  }
  return result;
};

const getClient = () => pool.connect();

module.exports = { query, getClient };
