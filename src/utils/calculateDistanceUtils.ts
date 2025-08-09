export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  // Haversine formula to calculate great-circle distance in miles
  const RKM = 6371; // Earth's radius in kilometers
  const RAD = Math.PI / 180;
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  const distanceKm = 2 * RKM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const KM_TO_MILES = 0.621371;
  return Math.floor(distanceKm * KM_TO_MILES);
}
