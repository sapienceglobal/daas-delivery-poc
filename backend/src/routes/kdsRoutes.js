import express from 'express';
import {
  getStations,
  createStation,
  updateStation,
  deleteStation,
  getSettings,
  updateSettings,
  getStats
} from '../controllers/kdsController.js';

// base path in app.js should be /api/kds
const router = express.Router({ mergeParams: true });

// :restaurantId is expected in the route either via mergeParams or direct path
router.get('/restaurants/:restaurantId/stations', getStations);
router.post('/restaurants/:restaurantId/stations', createStation);
router.put('/restaurants/:restaurantId/stations/:stationId', updateStation);
router.delete('/restaurants/:restaurantId/stations/:stationId', deleteStation);

router.get('/restaurants/:restaurantId/settings', getSettings);
router.put('/restaurants/:restaurantId/settings', updateSettings);

router.get('/restaurants/:restaurantId/stats', getStats);

export default router;
