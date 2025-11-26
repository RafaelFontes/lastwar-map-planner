import { ICommentRepository } from '../interfaces.js';

const STORAGE_KEY = 'mapEditor_comments';

/**
 * localStorage implementation of ICommentRepository
 */
export class LocalStorageCommentRepository extends ICommentRepository {
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
      console.error('Error loading comments from localStorage:', error);
      this._cache = new Map();
    }

    return this._cache;
  }

  _saveToStorage(comments) {
    try {
      // Convert Map to array of [key, value] pairs for JSON serialization
      const serializable = Array.from(comments.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      this._cache = comments;
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
      throw error;
    }
  }

  async getAll() {
    return new Map(this._loadFromStorage());
  }

  async getForTile(tileId) {
    const comments = this._loadFromStorage();
    return comments.get(tileId) || [];
  }

  async add(tileId, comment) {
    const comments = this._loadFromStorage();
    const newComments = new Map(comments);
    const tileComments = newComments.get(tileId) || [];
    newComments.set(tileId, [...tileComments, comment]);
    this._saveToStorage(newComments);
  }

  async delete(tileId, commentIndex) {
    const comments = this._loadFromStorage();
    const newComments = new Map(comments);
    const tileComments = newComments.get(tileId) || [];

    if (commentIndex >= 0 && commentIndex < tileComments.length) {
      const updatedComments = [
        ...tileComments.slice(0, commentIndex),
        ...tileComments.slice(commentIndex + 1)
      ];
      if (updatedComments.length > 0) {
        newComments.set(tileId, updatedComments);
      } else {
        newComments.delete(tileId);
      }
      this._saveToStorage(newComments);
    }
  }

  async saveAll(comments) {
    this._saveToStorage(new Map(comments));
  }

  /**
   * Invalidate the cache (useful for testing or forced refresh)
   */
  invalidateCache() {
    this._cache = null;
  }
}
