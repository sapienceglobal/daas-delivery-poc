import express from 'express';
import { getAutocompleteSuggestions, getPlaceDetails, reverseGeocode, geocodeAddress } from '../controllers/locationController.js';

const router = express.Router();

router.get('/autocomplete', getAutocompleteSuggestions);
router.get('/place', getPlaceDetails);
router.get('/geocode', geocodeAddress);
router.get('/reverse-geocode', reverseGeocode);

export default router;
