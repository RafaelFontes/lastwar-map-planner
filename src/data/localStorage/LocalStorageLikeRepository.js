import { ILikeRepository } from '../interfaces.js';

const STORAGE_KEY = 'mapEditor_likes';

/**
 * localStorage implementation of ILikeRepository
 */
export class LocalStorageLikeRepository extends ILikeRepository {
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
        this._cache = new Map(parsed);
      } else {
        this._cache = new Map();
      }
    } catch (error) {
      console.error('Error loading likes from localStorage:', error);
      this._cache = new Map();
    }

    return this._cache;
  }

  _saveToStorage(likes) {
    try {
      const serializable = Array.from(likes.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      this._cache = likes;
    } catch (error) {
      console.error('Error saving likes to localStorage:', error);
      throw error;
    }
  }

  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAll() {
    return new Map(this._loadFromStorage());
  }

  async getForTile(tileId) {
    const likes = this._loadFromStorage();
    return likes.get(tileId) || [];
  }

  async getSummary(tileId, userId) {
    const tileLikes = await this.getForTile(tileId);

    let likes = 0;
    let dislikes = 0;
    let userVote = null;

    for (const like of tileLikes) {
      if (like.type === 'like') {
        likes++;
      } else if (like.type === 'dislike') {
        dislikes++;
      }
      if (userId && like.userId === userId) {
        userVote = like.type;
      }
    }

    return { likes, dislikes, userVote };
  }

  async vote(tileId, type, user, userId) {
    const likes = this._loadFromStorage();
    const newLikes = new Map(likes);
    const tileLikes = [...(newLikes.get(tileId) || [])];

    // Find existing vote by this user
    const existingIndex = tileLikes.findIndex(l => l.userId === userId);

    const like = {
      id: existingIndex >= 0 ? tileLikes[existingIndex].id : this._generateId(),
      user,
      userId,
      type,
      timestamp: new Date().toLocaleString()
    };

    if (existingIndex >= 0) {
      // Update existing vote
      tileLikes[existingIndex] = like;
    } else {
      // Add new vote
      tileLikes.unshift(like);
    }

    newLikes.set(tileId, tileLikes);
    this._saveToStorage(newLikes);

    return like;
  }

  async removeVote(tileId, userId) {
    const likes = this._loadFromStorage();
    const newLikes = new Map(likes);
    const tileLikes = newLikes.get(tileId) || [];

    const filteredLikes = tileLikes.filter(l => l.userId !== userId);

    if (filteredLikes.length > 0) {
      newLikes.set(tileId, filteredLikes);
    } else {
      newLikes.delete(tileId);
    }

    this._saveToStorage(newLikes);
  }

  invalidateCache() {
    this._cache = null;
  }
}
