// https://www.google.com/search?q=radius+of+the+earth+in+nautical+miles
const EARTH_RADIUS = 3443.92;

const toRad = (deg: number) => (deg * Math.PI) / 180;

// https://stackoverflow.com/a/27943
export const getDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLatSquared = sinDLat * sinDLat;
  const sinDLng = Math.sin(dLng / 2);
  const sinDLngSquared = sinDLng * sinDLng;
  const a =
    sinDLatSquared +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDLngSquared;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = EARTH_RADIUS * c;
  return d;
};
