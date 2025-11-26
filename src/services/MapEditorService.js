import { DEFAULT_TILE_DATA } from '../data/interfaces.js';

/**
 * MapEditorService handles all business logic for the map editor.
 * It coordinates between repositories and provides a clean API for the UI layer.
 */
export class MapEditorService {
  /**
   * @param {Object} repositories - Injected repositories
   * @param {import('../data/interfaces.js').ITileRepository} repositories.tileRepository
   * @param {import('../data/interfaces.js').ICommentRepository} repositories.commentRepository
   * @param {import('../data/interfaces.js').IHistoryRepository} repositories.historyRepository
   * @param {import('../data/interfaces.js').ITileGeometryRepository} repositories.tileGeometryRepository
   */
  constructor({ tileRepository, commentRepository, historyRepository, tileGeometryRepository }) {
    this._tileRepository = tileRepository;
    this._commentRepository = commentRepository;
    this._historyRepository = historyRepository;
    this._tileGeometryRepository = tileGeometryRepository;
  }

  // ============================================
  // Tile Geometry (read-only, from JSON)
  // ============================================

  /**
   * Load tile geometry data
   * @returns {Promise<import('../data/interfaces.js').TileGeometry>}
   */
  async loadTileGeometry() {
    return this._tileGeometryRepository.load();
  }

  // ============================================
  // Tile Data Operations
  // ============================================

  /**
   * Get all tiles
   * @returns {Promise<Map<number, import('../data/interfaces.js').TileData>>}
   */
  async getAllTiles() {
    return this._tileRepository.getAll();
  }

  /**
   * Get tile data by ID, returns default if not found
   * @param {number} tileId
   * @returns {Promise<import('../data/interfaces.js').TileData>}
   */
  async getTileData(tileId) {
    const tile = await this._tileRepository.get(tileId);
    return tile || { ...DEFAULT_TILE_DATA };
  }

  /**
   * Save tile data and record history
   * @param {number} tileId
   * @param {import('../data/interfaces.js').TileData} newData
   * @param {import('../data/interfaces.js').TileData} [oldData] - Previous data for history
   * @returns {Promise<void>}
   */
  async saveTileData(tileId, newData, oldData) {
    // Get old data if not provided
    if (!oldData) {
      oldData = await this.getTileData(tileId);
    }

    await this._tileRepository.save(tileId, newData);
    await this._addHistoryEntry(tileId, oldData, newData);
  }

  /**
   * Clear tile data and record history
   * @param {number} tileId
   * @returns {Promise<void>}
   */
  async clearTileData(tileId) {
    const oldData = await this._tileRepository.get(tileId);
    if (oldData) {
      await this._tileRepository.delete(tileId);
      await this._addHistoryEntry(tileId, oldData, null);
    }
  }

  /**
   * Save tile data silently (no history entry)
   * Used for operations like moving labels that shouldn't clutter history
   * @param {number} tileId
   * @param {import('../data/interfaces.js').TileData} data
   * @returns {Promise<void>}
   */
  async saveTileDataSilent(tileId, data) {
    await this._tileRepository.save(tileId, data);
  }

  /**
   * Get labeled tiles (tiles with number or name), optionally filtered
   * @param {Map<number, import('../data/interfaces.js').TileData>} tiles - All tiles
   * @param {string} [filter] - Optional filter string
   * @returns {Array<{id: number} & import('../data/interfaces.js').TileData>}
   */
  getLabeledTiles(tiles, filter = '') {
    const labeledTiles = [];

    tiles.forEach((data, tileId) => {
      if (data.number !== '' || data.name) {
        labeledTiles.push({ id: tileId, ...data });
      }
    });

    // Filter
    const filterLower = filter.toLowerCase();
    const filteredTiles = labeledTiles.filter(tile => {
      if (!filter) return true;
      const numberMatch = tile.number !== undefined && tile.number.toString().includes(filter);
      const nameMatch = tile.name && tile.name.toLowerCase().includes(filterLower);
      return numberMatch || nameMatch;
    });

    // Sort by number
    filteredTiles.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

    return filteredTiles;
  }

  // ============================================
  // Comment Operations
  // ============================================

  /**
   * Get all comments
   * @returns {Promise<Map<number, import('../data/interfaces.js').Comment[]>>}
   */
  async getAllComments() {
    return this._commentRepository.getAll();
  }

  /**
   * Get comments for a specific tile
   * @param {number} tileId
   * @returns {Promise<import('../data/interfaces.js').Comment[]>}
   */
  async getComments(tileId) {
    return this._commentRepository.getForTile(tileId);
  }

  /**
   * Add a comment to a tile
   * @param {number} tileId
   * @param {string} text
   * @param {string} user
   * @returns {Promise<import('../data/interfaces.js').Comment|null>}
   */
  async addComment(tileId, text, user) {
    if (!text.trim()) return null;

    const comment = {
      user,
      text: text.trim(),
      timestamp: new Date().toLocaleString()
    };

    await this._commentRepository.add(tileId, comment);
    return comment;
  }

  /**
   * Delete a comment from a tile
   * @param {number} tileId
   * @param {number} commentIndex
   * @returns {Promise<void>}
   */
  async deleteComment(tileId, commentIndex) {
    await this._commentRepository.delete(tileId, commentIndex);
  }

  // ============================================
  // History Operations
  // ============================================

  /**
   * Get history entries
   * @param {number} [limit] - Maximum entries to return
   * @returns {Promise<import('../data/interfaces.js').HistoryEntry[]>}
   */
  async getHistory(limit) {
    return this._historyRepository.getAll(limit);
  }

  /**
   * Clear all history
   * @returns {Promise<void>}
   */
  async clearHistory() {
    await this._historyRepository.clear();
  }

  /**
   * Add a history entry based on tile changes
   * @param {number} tileId
   * @param {import('../data/interfaces.js').TileData} oldData
   * @param {import('../data/interfaces.js').TileData|null} newData
   * @returns {Promise<import('../data/interfaces.js').HistoryEntry>}
   * @private
   */
  async _addHistoryEntry(tileId, oldData, newData) {
    const timestamp = new Date().toLocaleString();
    let action = '';
    let details = '';

    const isOldEmpty = !oldData || Object.keys(oldData).every(k => !oldData[k]);

    if (isOldEmpty && newData) {
      action = 'Created';
      details = `Tile ${tileId}: ${newData.name || 'Unnamed'}`;
    } else if (!newData) {
      action = 'Cleared';
      details = `Tile ${tileId}: ${oldData?.name || 'Unnamed'}`;
    } else {
      action = 'Updated';
      const changes = [];
      if (oldData.number !== newData.number) changes.push('number');
      if (oldData.name !== newData.name) changes.push('name');
      if (oldData.icon !== newData.icon) changes.push('icon');
      if (oldData.color !== newData.color) changes.push('color');
      if (oldData.comments !== newData.comments) changes.push('comments');
      details = `Tile ${tileId}: ${changes.join(', ') || 'no changes'}`;
    }

    const entry = { timestamp, action, details };
    await this._historyRepository.add(entry);
    return entry;
  }
}
