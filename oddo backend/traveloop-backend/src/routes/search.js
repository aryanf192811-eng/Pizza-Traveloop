const express = require('express');
const { searchCities, searchActivities, getPopularCities, getPopularActivities } = require('../controllers/searchController');

const router = express.Router();

// CRITICAL: /cities/popular must be before /cities (no param conflict)
router.get('/cities/popular', getPopularCities);
router.get('/cities', searchCities);
router.get('/activities/popular', getPopularActivities);
router.get('/activities', searchActivities);

module.exports = router;
