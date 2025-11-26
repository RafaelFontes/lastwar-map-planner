/**
 * Data Layer Interfaces
 *
 * These interfaces define the contract for data persistence.
 * Any implementation (localStorage, IndexedDB, API, etc.) must implement these methods.
 */

/**
 * @typedef {Object} LabelOffset
 * @property {number} x - X offset from centroid
 * @property {number} y - Y offset from centroid
 */

/**
 * @typedef {Object} TileData
 * @property {string} number - Tile number identifier
 * @property {string} name - Tile name/label
 * @property {string} icon - Emoji icon
 * @property {string} color - Hex color for tile background
 * @property {string} comments - Notes field within tile
 * @property {LabelOffset} [labelOffset] - Custom position offset for label
 */

/**
 * @typedef {Object} Comment
 * @property {string} user - Author of the comment
 * @property {string} text - Comment content
 * @property {string} timestamp - Formatted date/time
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string} timestamp - Formatted date/time
 * @property {string} action - 'Created' | 'Updated' | 'Cleared'
 * @property {string} details - Description of what changed
 */

/**
 * @typedef {Object} TileGeometry
 * @property {number} width - Map width
 * @property {number} height - Map height
 * @property {Array<{id: number, centerX: number, centerY: number, polygon: Array<{x: number, y: number}>}>} tiles
 */

export const DEFAULT_TILE_DATA = {
  number: '',
  name: '',
  icon: '',
  color: '#f8f9fa',
  comments: '',
  labelOffset: null
};

/**
 * Interface for tile data storage
 * @interface ITileRepository
 */
export class ITileRepository {
  /**
   * Get all tiles
   * @returns {Promise<Map<number, TileData>>}
   */
  async getAll() {
    throw new Error('Not implemented');
  }

  /**
   * Get a single tile by ID
   * @param {number} tileId
   * @returns {Promise<TileData|null>}
   */
  async get(tileId) {
    throw new Error('Not implemented');
  }

  /**
   * Save a tile
   * @param {number} tileId
   * @param {TileData} data
   * @returns {Promise<void>}
   */
  async save(tileId, data) {
    throw new Error('Not implemented');
  }

  /**
   * Delete a tile
   * @param {number} tileId
   * @returns {Promise<void>}
   */
  async delete(tileId) {
    throw new Error('Not implemented');
  }

  /**
   * Save all tiles (bulk operation)
   * @param {Map<number, TileData>} tiles
   * @returns {Promise<void>}
   */
  async saveAll(tiles) {
    throw new Error('Not implemented');
  }
}

/**
 * Interface for comments storage
 * @interface ICommentRepository
 */
export class ICommentRepository {
  /**
   * Get all comments
   * @returns {Promise<Map<number, Comment[]>>}
   */
  async getAll() {
    throw new Error('Not implemented');
  }

  /**
   * Get comments for a tile
   * @param {number} tileId
   * @returns {Promise<Comment[]>}
   */
  async getForTile(tileId) {
    throw new Error('Not implemented');
  }

  /**
   * Add a comment to a tile
   * @param {number} tileId
   * @param {Comment} comment
   * @returns {Promise<void>}
   */
  async add(tileId, comment) {
    throw new Error('Not implemented');
  }

  /**
   * Delete a comment
   * @param {number} tileId
   * @param {number} commentIndex
   * @returns {Promise<void>}
   */
  async delete(tileId, commentIndex) {
    throw new Error('Not implemented');
  }

  /**
   * Save all comments (bulk operation)
   * @param {Map<number, Comment[]>} comments
   * @returns {Promise<void>}
   */
  async saveAll(comments) {
    throw new Error('Not implemented');
  }
}

/**
 * Interface for history storage
 * @interface IHistoryRepository
 */
export class IHistoryRepository {
  /**
   * Get all history entries
   * @param {number} [limit] - Maximum entries to return
   * @returns {Promise<HistoryEntry[]>}
   */
  async getAll(limit) {
    throw new Error('Not implemented');
  }

  /**
   * Add a history entry
   * @param {HistoryEntry} entry
   * @returns {Promise<void>}
   */
  async add(entry) {
    throw new Error('Not implemented');
  }

  /**
   * Clear all history
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('Not implemented');
  }

  /**
   * Save all history entries (bulk operation)
   * @param {HistoryEntry[]} entries
   * @returns {Promise<void>}
   */
  async saveAll(entries) {
    throw new Error('Not implemented');
  }
}

/**
 * Interface for tile geometry data (read-only)
 * @interface ITileGeometryRepository
 */
export class ITileGeometryRepository {
  /**
   * Load tile geometry from source
   * @returns {Promise<TileGeometry>}
   */
  async load() {
    throw new Error('Not implemented');
  }
}
