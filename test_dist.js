function getDist(addressLat, addressLng, restLat, restLng) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(addressLat - restLat);
    const dLon = toRad(addressLng - restLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(restLat)) * Math.cos(toRad(addressLat)) * Math.sin(dLon / 2) ** 2;
    const distanceMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distanceMiles;
}
console.log('Zero:', getDist(0, 0, 37.78918, -122.40873));
