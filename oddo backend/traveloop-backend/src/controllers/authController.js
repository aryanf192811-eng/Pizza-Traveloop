const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

// ── Multer config ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

const signToken = (id, email, role) =>
  jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, role, created_at`,
      [first_name.trim(), last_name.trim(), email, password_hash, phone || null]
    );

    const user = result.rows[0];
    const token = signToken(user.id, user.email, user.role);
    return res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      `SELECT id, first_name, last_name, email, password_hash, role, created_at
       FROM users WHERE email=$1 AND deleted_at IS NULL`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const { password_hash: _, ...safeUser } = user;
    const token = signToken(user.id, user.email, user.role);
    return res.status(200).json({ success: true, data: { token, user: safeUser } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, phone, city, country,
              photo_url, role, gemini_key, created_at
       FROM users WHERE id=$1 AND deleted_at IS NULL`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['first_name', 'last_name', 'phone', 'city', 'country', 'gemini_key'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) {
      updates.photo_url = `/uploads/${req.file.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(', ');

    const result = await db.query(
      `UPDATE users SET ${setClause} WHERE id=$${fields.length + 1}
       RETURNING id, first_name, last_name, email, phone, city, country, photo_url, role, gemini_key, created_at`,
      [...values, req.user.id]
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, upload };
