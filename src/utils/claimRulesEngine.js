/**
 * Rules engine for tile claiming validation
 */

import { isAdjacentToOwned } from './adjacencyUtils.js';

// Constants
const MAX_NUMBERED_TILES = 6;
const SPECIAL_TILE_NUMBER = 7; // Tile #7 doesn't count toward limit

/**
 * Validate if a tile can be claimed by an alliance
 * @param {Object} params
 * @param {string} tileId - The tile ID to claim
 * @param {Object} tileData - The tile's data (number, name, etc.)
 * @param {Set} ownedTileIds - Set of tile IDs currently owned by the alliance
 * @param {Map} allTileData - Map of all tile data (tileId -> tileData)
 * @param {Map} tileClaims - Map of current claims (tileId -> {allianceId, ...})
 * @param {Map} adjacencyMap - The adjacency map
 * @param {number} movesRemaining - Number of moves remaining for the day
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Object} { valid: boolean, error: string | null }
 */
export function validateClaim({
  tileId,
  tileData,
  ownedTileIds,
  allTileData,
  tileClaims,
  adjacencyMap,
  movesRemaining,
  isAdmin = false,
}) {
  // Admin bypasses all rules
  if (isAdmin) {
    return { valid: true, error: null };
  }

  // Check if moves remaining
  if (movesRemaining <= 0) {
    return { valid: false, error: 'No moves remaining for today' };
  }

  // Check if tile is already claimed by the same alliance
  const existingClaim = tileClaims.get(tileId);
  if (existingClaim) {
    return { valid: false, error: `Tile already claimed by ${existingClaim.allianceName}` };
  }

  // Get tile number (might be undefined or empty string)
  const tileNumber = parseInt(tileData?.number, 10);
  const hasNumber = !isNaN(tileNumber) && tileNumber > 0;

  // Check tile limit (only for numbered tiles, excluding #7)
  if (hasNumber && tileNumber !== SPECIAL_TILE_NUMBER) {
    const ownedNumberedTiles = countNumberedTiles(ownedTileIds, allTileData);
    if (ownedNumberedTiles >= MAX_NUMBERED_TILES) {
      return { valid: false, error: `Maximum of ${MAX_NUMBERED_TILES} numbered tiles reached (tile #7 doesn't count)` };
    }
  }

  // Check number progression rule
  if (hasNumber && tileNumber > 1) {
    const previousNumber = tileNumber - 1;
    const hasPreviousNumber = hasNumberedTile(ownedTileIds, allTileData, previousNumber);
    if (!hasPreviousNumber) {
      return { valid: false, error: `Must own a tile numbered ${previousNumber} before claiming tile #${tileNumber}` };
    }
  }

  // Check adjacency rule (only if alliance owns at least one tile)
  if (ownedTileIds.size > 0) {
    if (!isAdjacentToOwned(tileId, ownedTileIds, adjacencyMap)) {
      return { valid: false, error: 'Tile must be adjacent to an existing territory' };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validate if a tile can be cleared by an alliance
 * @param {Object} params
 * @param {string} tileId - The tile ID to clear
 * @param {Map} tileClaims - Map of current claims (tileId -> {allianceId, ...})
 * @param {string} userAllianceId - The user's alliance ID
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Object} { valid: boolean, error: string | null }
 */
export function validateClear({
  tileId,
  tileClaims,
  userAllianceId,
  isAdmin = false,
}) {
  // Admin can clear any tile
  if (isAdmin) {
    return { valid: true, error: null };
  }

  const claim = tileClaims.get(tileId);

  // Check if tile is claimed
  if (!claim) {
    return { valid: false, error: 'Tile is not claimed' };
  }

  // Check if tile belongs to user's alliance
  if (claim.allianceId !== userAllianceId) {
    return { valid: false, error: 'Can only clear tiles belonging to your alliance' };
  }

  return { valid: true, error: null };
}

/**
 * Count how many numbered tiles (excluding #7) an alliance owns
 * @param {Set} ownedTileIds - Set of tile IDs owned by the alliance
 * @param {Map} allTileData - Map of all tile data
 * @returns {number}
 */
function countNumberedTiles(ownedTileIds, allTileData) {
  let count = 0;
  for (const tileId of ownedTileIds) {
    const data = allTileData.get(tileId);
    const tileNumber = parseInt(data?.number, 10);
    if (!isNaN(tileNumber) && tileNumber > 0 && tileNumber !== SPECIAL_TILE_NUMBER) {
      count++;
    }
  }
  return count;
}

/**
 * Check if alliance owns a tile with a specific number
 * @param {Set} ownedTileIds - Set of tile IDs owned by the alliance
 * @param {Map} allTileData - Map of all tile data
 * @param {number} targetNumber - The tile number to look for
 * @returns {boolean}
 */
function hasNumberedTile(ownedTileIds, allTileData, targetNumber) {
  for (const tileId of ownedTileIds) {
    const data = allTileData.get(tileId);
    const tileNumber = parseInt(data?.number, 10);
    if (tileNumber === targetNumber) {
      return true;
    }
  }
  return false;
}

/**
 * Get claimable tiles for an alliance
 * @param {Object} params
 * @param {Set} ownedTileIds - Tiles currently owned by the alliance
 * @param {Array} allTiles - All tile geometry objects
 * @param {Map} allTileData - All tile data
 * @param {Map} tileClaims - Current claims
 * @param {Map} adjacencyMap - Adjacency map
 * @param {number} movesRemaining - Moves remaining
 * @param {boolean} isAdmin - Admin mode
 * @returns {Set} Set of claimable tile IDs
 */
export function getClaimableTiles({
  ownedTileIds,
  allTiles,
  allTileData,
  tileClaims,
  adjacencyMap,
  movesRemaining,
  isAdmin = false,
}) {
  const claimable = new Set();

  for (const tile of allTiles) {
    const tileId = tile.id;
    const tileData = allTileData.get(tileId);

    const result = validateClaim({
      tileId,
      tileData,
      ownedTileIds,
      allTileData,
      tileClaims,
      adjacencyMap,
      movesRemaining,
      isAdmin,
    });

    if (result.valid) {
      claimable.add(tileId);
    }
  }

  return claimable;
}
