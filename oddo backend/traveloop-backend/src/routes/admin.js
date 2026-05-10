const express = require('express');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { getUsers, getTrips, getAnalytics } = require('../controllers/adminController');

const router = express.Router();

router.use(verifyToken, adminOnly);

router.get('/users', getUsers);
router.get('/trips', getTrips);
router.get('/analytics', getAnalytics);

module.exports = router;
