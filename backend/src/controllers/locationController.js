import axios from 'axios';
import logger from '../utils/logger.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

import https from 'https';

const httpsAgent = new https.Agent({ family: 4 });

// 1. Autocomplete Search
export const getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q, sessionToken } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
    if (!GOOGLE_MAPS_API_KEY) {
      logger.error('GOOGLE_MAPS_API_KEY is missing');
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }

    const requestBody = {
      input: q,
      includedRegionCodes: ['us']
    };
    if (sessionToken) {
      requestBody.sessionToken = sessionToken;
    }

    const response = await axios.post('https://places.googleapis.com/v1/places:autocomplete', requestBody, {
      httpsAgent,
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // The new API doesn't return a 'status' field in the same way, HTTP errors are thrown by axios.
    // If suggestions is missing or empty, we return an empty array.
    const suggestionsList = response.data.suggestions || [];

    // Map Google's predictions to a format similar to what frontend expects
    const suggestions = suggestionsList
      .filter(s => s.placePrediction) // Only keep place predictions
      .map(s => {
        const p = s.placePrediction;
        return {
          place_id: p.placeId,
          display_name: p.text?.text, // Frontend uses display_name for rendering
          main_text: p.structuredFormat?.mainText?.text,
          secondary_text: p.structuredFormat?.secondaryText?.text
        };
      });

    res.json(suggestions);
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    logger.error(`Autocomplete error: ${errorMsg}`, { 
      details: err.response?.data || null 
    });
    res.status(500).json({ error: 'Failed to fetch suggestions', details: errorMsg });
  }
};

// 2. Get Place Details (Geocode by Place ID)
export const getPlaceDetails = async (req, res) => {
  try {
    const { place_id, sessionToken } = req.query;
    if (!place_id) return res.status(400).json({ error: 'place_id is required' });

    let url = `https://places.googleapis.com/v1/places/${place_id}`;
    if (sessionToken) {
      url += `?sessionToken=${sessionToken}`;
    }

    const response = await axios.get(url, {
      httpsAgent,
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'id,location,addressComponents,formattedAddress'
      }
    });

    const result = response.data;
    
    // Parse address components (New API format uses longText/shortText and types)
    const address = {};
    if (result.addressComponents) {
      result.addressComponents.forEach(component => {
        const types = component.types;
        if (types.includes('street_number')) address.house_number = component.longText;
        if (types.includes('route')) address.road = component.longText;
        if (types.includes('locality') || types.includes('neighborhood')) address.city = component.longText;
        if (types.includes('administrative_area_level_1')) address.state = component.shortText;
        if (types.includes('postal_code')) address.postcode = component.longText;
      });
    }

    res.json({
      place_id: result.id,
      lat: result.location?.latitude,
      lng: result.location?.longitude,
      display_name: result.formattedAddress,
      address
    });
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    logger.error(`Place details error: ${errorMsg}`, { 
      details: err.response?.data || null 
    });
    res.status(500).json({ error: 'Failed to fetch place details', details: errorMsg });
  }
};

// 3. Reverse Geocode (Lat/Lng to Address)
export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon, lng } = req.query;
    const longitude = lon || lng;
    if (!lat || !longitude) return res.status(400).json({ error: 'lat and lon/lng are required' });

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      httpsAgent,
      params: {
        latlng: `${lat},${longitude}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${response.data.status} - ${response.data.error_message || 'No additional details'}`);
    }

    if (response.data.status === 'ZERO_RESULTS' || response.data.results.length === 0) {
      return res.json(null);
    }

    const result = response.data.results[0];
    
    // Parse address components
    let houseNumber = '';
    let road = '';
    let city = '';
    let state = '';
    let zip = '';

    result.address_components?.forEach(comp => {
      if (comp.types.includes('street_number')) houseNumber = comp.long_name;
      if (comp.types.includes('route')) road = comp.long_name;
      if (comp.types.includes('locality') || comp.types.includes('sublocality')) {
        if (!city) city = comp.long_name;
      }
      if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
      if (comp.types.includes('postal_code')) zip = comp.long_name;
    });

    res.json({
      lat: result.geometry?.location?.lat,
      lon: result.geometry?.location?.lng,
      lng: result.geometry?.location?.lng,
      display_name: result.formatted_address,
      address: {
        house_number: houseNumber,
        road: road,
        city: city,
        state: state,
        postcode: zip
      }
    });
  } catch (err) {
    const errorMsg = err.response?.data?.error_message || err.message;
    logger.error(`Reverse geocode error: ${errorMsg}`, { 
      details: err.response?.data || null 
    });
    res.status(500).json({ error: 'Failed to reverse geocode', details: errorMsg });
  }
};

// 4. Geocode by Address String
export const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: 'address is required' });

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      httpsAgent,
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${response.data.status} - ${response.data.error_message || 'No additional details'}`);
    }

    if (response.data.status === 'ZERO_RESULTS' || response.data.results.length === 0) {
      return res.json(null);
    }

    const result = response.data.results[0];
    
    // Parse address components
    let houseNumber = '';
    let road = '';
    let city = '';
    let state = '';
    let zip = '';

    result.address_components?.forEach(comp => {
      if (comp.types.includes('street_number')) houseNumber = comp.long_name;
      if (comp.types.includes('route')) road = comp.long_name;
      if (comp.types.includes('locality') || comp.types.includes('sublocality')) {
        if (!city) city = comp.long_name;
      }
      if (comp.types.includes('administrative_area_level_1')) state = comp.short_name;
      if (comp.types.includes('postal_code')) zip = comp.long_name;
    });

    res.json([{ // Returning array to mimic nominatim format for the silent geocode
      lat: result.geometry?.location?.lat,
      lon: result.geometry?.location?.lng,
      lng: result.geometry?.location?.lng,
      display_name: result.formatted_address,
      address: {
        house_number: houseNumber,
        road: road,
        city: city,
        state: state,
        postcode: zip
      }
    }]);
  } catch (err) {
    const errorMsg = err.response?.data?.error_message || err.message;
    logger.error(`Geocode error: ${errorMsg}`, { 
      details: err.response?.data || null 
    });
    res.status(500).json({ error: 'Failed to geocode address', details: errorMsg });
  }
};
