import { ITileGeometryRepository } from '../interfaces.js';

/**
 * Fetch-based implementation of ITileGeometryRepository
 * Loads tile geometry from the static JSON file
 */
export class FetchTileGeometryRepository extends ITileGeometryRepository {
  constructor(url = '/tile-data.json') {
    super();
    this._url = url;
    this._cache = null;
  }

  async load() {
    if (this._cache !== null) {
      return this._cache;
    }

    try {
      // Add cache-busting query param to prevent stale data
      const response = await fetch(`${this._url}?_=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Loaded ${data.tiles.length} tiles from ${this._url}`);
      this._cache = data;
      return data;
    } catch (error) {
      console.error('Error loading tile geometry:', error);
      throw error;
    }
  }

  /**
   * Invalidate the cache (useful for testing or forced refresh)
   */
  invalidateCache() {
    this._cache = null;
  }
}
