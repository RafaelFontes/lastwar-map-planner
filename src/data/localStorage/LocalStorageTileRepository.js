import { ITileRepository } from '../interfaces.js';

const STORAGE_KEY = 'mapEditor_tiles';

/**
 * localStorage implementation of ITileRepository
 */
export class LocalStorageTileRepository extends ITileRepository {
  constructor() {
    super();
    this._cache = null;
  }

  _loadFromStorage() {
    if (this._cache !== null) {
      return this._cache;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert array of [key, value] pairs back to Map
        this._cache = new Map(parsed);
      } else {
        this._cache = new Map();
      }
    } catch (error) {
      console.error('Error loading tiles from localStorage:', error);
      this._cache = new Map();
    }

    return this._cache;
  }

  _saveToStorage(tiles) {
    try {
      // Convert Map to array of [key, value] pairs for JSON serialization
      const serializable = Array.from(tiles.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      this._cache = tiles;
    } catch (error) {
      console.error('Error saving tiles to localStorage:', error);
      throw error;
    }
  }

  async getAll() {
    return new Map(this._loadFromStorage());
  }

  async get(tileId) {
    const tiles = this._loadFromStorage();
    return tiles.get(tileId) || null;
  }

  async save(tileId, data) {
    const tiles = this._loadFromStorage();
    const newTiles = new Map(tiles);
    newTiles.set(tileId, { ...data });
    this._saveToStorage(newTiles);
  }

  async delete(tileId) {
    const tiles = this._loadFromStorage();
    const newTiles = new Map(tiles);
    newTiles.delete(tileId);
    this._saveToStorage(newTiles);
  }

  async saveAll(tiles) {
    this._saveToStorage(new Map(tiles));
  }

  /**
   * Invalidate the cache (useful for testing or forced refresh)
   */
  invalidateCache() {
    this._cache = null;
  }
}
