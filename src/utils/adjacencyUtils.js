/**
 * Utility functions for detecting tile adjacency
 */

/**
 * Calculate distance between two points
 */
function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Check if two line segments share a significant portion (are collinear and overlapping)
 * or are very close to each other
 */
function segmentsAreAdjacent(seg1Start, seg1End, seg2Start, seg2End, threshold = 5) {
  // Check if any endpoints are very close
  const endpointDistances = [
    distance(seg1Start, seg2Start),
    distance(seg1Start, seg2End),
    distance(seg1End, seg2Start),
    distance(seg1End, seg2End),
  ];

  // If at least 2 endpoints are close, segments share an edge
  const closeEndpoints = endpointDistances.filter(d => d < threshold).length;
  if (closeEndpoints >= 2) {
    return true;
  }

  return false;
}

/**
 * Check if two polygons share an edge (are adjacent)
 */
function polygonsShareEdge(polygon1, polygon2, threshold = 5) {
  // Get edges from each polygon
  const edges1 = [];
  const edges2 = [];

  for (let i = 0; i < polygon1.length; i++) {
    const next = (i + 1) % polygon1.length;
    edges1.push([polygon1[i], polygon1[next]]);
  }

  for (let i = 0; i < polygon2.length; i++) {
    const next = (i + 1) % polygon2.length;
    edges2.push([polygon2[i], polygon2[next]]);
  }

  // Check if any pair of edges are adjacent
  for (const [start1, end1] of edges1) {
    for (const [start2, end2] of edges2) {
      if (segmentsAreAdjacent(start1, end1, start2, end2, threshold)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Build adjacency map for all tiles
 * @param {Array} tiles - Array of tile objects with id and polygon properties
 * @returns {Map} Map<tileId, Set<adjacentTileIds>>
 */
export function buildAdjacencyMap(tiles) {
  const adjacencyMap = new Map();

  // Initialize empty sets for each tile
  for (const tile of tiles) {
    adjacencyMap.set(tile.id, new Set());
  }

  // Check each pair of tiles for adjacency
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      const tile1 = tiles[i];
      const tile2 = tiles[j];

      // Quick bounding box check to skip obviously non-adjacent tiles
      const xOverlap = !(tile1.maxX < tile2.minX - 10 || tile2.maxX < tile1.minX - 10);
      const yOverlap = !(tile1.maxY < tile2.minY - 10 || tile2.maxY < tile1.minY - 10);

      if (!xOverlap || !yOverlap) {
        continue;
      }

      // Detailed polygon edge check
      if (polygonsShareEdge(tile1.polygon, tile2.polygon)) {
        adjacencyMap.get(tile1.id).add(tile2.id);
        adjacencyMap.get(tile2.id).add(tile1.id);
      }
    }
  }

  return adjacencyMap;
}

/**
 * Check if a tile is adjacent to any tile in a set
 * @param {number} tileId - The tile to check
 * @param {Set} ownedTileIds - Set of tile IDs owned by the alliance
 * @param {Map} adjacencyMap - The adjacency map
 * @returns {boolean}
 */
export function isAdjacentToOwned(tileId, ownedTileIds, adjacencyMap) {
  const adjacent = adjacencyMap.get(tileId);
  if (!adjacent) return false;

  for (const adjId of adjacent) {
    if (ownedTileIds.has(adjId)) {
      return true;
    }
  }
  return false;
}

/**
 * Get all adjacent tile IDs for a given tile
 * @param {number} tileId - The tile to get adjacencies for
 * @param {Map} adjacencyMap - The adjacency map
 * @returns {Set} Set of adjacent tile IDs
 */
export function getAdjacentTiles(tileId, adjacencyMap) {
  return adjacencyMap.get(tileId) || new Set();
}
