import { IHistoryRepository } from '../interfaces.js';

const STORAGE_KEY = 'mapEditor_history';
const MAX_HISTORY_ENTRIES = 50;

/**
 * localStorage implementation of IHistoryRepository
 */
export class LocalStorageHistoryRepository extends IHistoryRepository {
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
        this._cache = JSON.parse(stored);
      } else {
        this._cache = [];
      }
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
      this._cache = [];
    }

    return this._cache;
  }

  _saveToStorage(history) {
    try {
      // Limit history to max entries
      const limited = history.slice(0, MAX_HISTORY_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      this._cache = limited;
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
      throw error;
    }
  }

  async getAll(limit) {
    const history = this._loadFromStorage();
    if (limit && limit > 0) {
      return history.slice(0, limit);
    }
    return [...history];
  }

  async add(entry) {
    const history = this._loadFromStorage();
    // Add new entry at the beginning (most recent first)
    const newHistory = [entry, ...history];
    this._saveToStorage(newHistory);
  }

  async clear() {
    this._saveToStorage([]);
  }

  async saveAll(entries) {
    this._saveToStorage([...entries]);
  }

  /**
   * Invalidate the cache (useful for testing or forced refresh)
   */
  invalidateCache() {
    this._cache = null;
  }
}
