/**
 * Calculate the centroid of a polygon using the shoelace formula
 * @param {Array<{x: number, y: number}>} polygon - Array of polygon vertices
 * @returns {{x: number, y: number}} Centroid coordinates
 */
export function calculatePolygonCentroid(polygon) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    area += cross;
    cx += (polygon[i].x + polygon[j].x) * cross;
    cy += (polygon[i].y + polygon[j].y) * cross;
  }

  area = area / 2;
  cx = cx / (6 * area);
  cy = cy / (6 * area);

  return { x: cx, y: cy };
}

/**
 * Convert polygon array to flat points array for Konva
 * @param {Array<{x: number, y: number}>} polygon - Array of polygon vertices
 * @returns {number[]} Flat array of [x1, y1, x2, y2, ...]
 */
export function polygonToPoints(polygon) {
  const points = [];
  polygon.forEach(point => {
    points.push(point.x, point.y);
  });
  return points;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param {{x: number, y: number}} point - Point to check
 * @param {Array<{x: number, y: number}>} polygon - Array of polygon vertices
 * @returns {boolean} True if point is inside polygon
 */
export function isPointInPolygon(point, polygon) {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Constrain a point to stay within a polygon boundary
 * If point is outside, find the closest point on the polygon edge
 * @param {{x: number, y: number}} point - Point to constrain
 * @param {Array<{x: number, y: number}>} polygon - Array of polygon vertices
 * @returns {{x: number, y: number}} Constrained point
 */
export function constrainPointToPolygon(point, polygon) {
  if (isPointInPolygon(point, polygon)) {
    return point;
  }

  // Find closest point on polygon edge
  let closestPoint = null;
  let minDist = Infinity;

  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = polygon[i];
    const p2 = polygon[j];

    // Find closest point on line segment
    const closest = closestPointOnSegment(point, p1, p2);
    const dist = distance(point, closest);

    if (dist < minDist) {
      minDist = dist;
      closestPoint = closest;
    }
  }

  return closestPoint;
}

/**
 * Find the closest point on a line segment to a given point
 * @param {{x: number, y: number}} point
 * @param {{x: number, y: number}} p1 - Start of segment
 * @param {{x: number, y: number}} p2 - End of segment
 * @returns {{x: number, y: number}}
 */
function closestPointOnSegment(point, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return { ...p1 };
  }

  let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  return {
    x: p1.x + t * dx,
    y: p1.y + t * dy
  };
}

/**
 * Calculate distance between two points
 * @param {{x: number, y: number}} p1
 * @param {{x: number, y: number}} p2
 * @returns {number}
 */
function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
