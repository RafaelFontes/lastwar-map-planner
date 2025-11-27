import { ILikeRepository } from '../interfaces.js';
import { supabase } from '../../lib/supabase.js';

/**
 * Supabase implementation of ILikeRepository
 */
export class SupabaseLikeRepository extends ILikeRepository {
  constructor() {
    super();
    this._cache = null;
  }

  _rowToLike(row) {
    return {
      id: row.id,
      user: row.user_name,
      userId: row.user_id,
      type: row.vote_type,
      timestamp: new Date(row.created_at).toLocaleString()
    };
  }

  async getAll() {
    const { data, error } = await supabase
      .from('tile_likes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading likes from Supabase:', error);
      return new Map();
    }

    const likes = new Map();
    for (const row of data) {
      const tileLikes = likes.get(row.tile_id) || [];
      tileLikes.push(this._rowToLike(row));
      likes.set(row.tile_id, tileLikes);
    }
    this._cache = likes;
    return new Map(likes);
  }

  async getForTile(tileId) {
    const { data, error } = await supabase
      .from('tile_likes')
      .select('*')
      .eq('tile_id', tileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading likes from Supabase:', error);
      return [];
    }

    return data.map(row => this._rowToLike(row));
  }

  async getSummary(tileId, userId) {
    const { data, error } = await supabase
      .from('tile_likes')
      .select('vote_type, user_id')
      .eq('tile_id', tileId);

    if (error) {
      console.error('Error loading like summary from Supabase:', error);
      return { likes: 0, dislikes: 0, userVote: null };
    }

    let likes = 0;
    let dislikes = 0;
    let userVote = null;

    for (const row of data) {
      if (row.vote_type === 'like') {
        likes++;
      } else if (row.vote_type === 'dislike') {
        dislikes++;
      }
      if (userId && row.user_id === userId) {
        userVote = row.vote_type;
      }
    }

    return { likes, dislikes, userVote };
  }

  async vote(tileId, type, user, userId) {
    // Check if user already has a vote on this tile
    const { data: existing } = await supabase
      .from('tile_likes')
      .select('id, vote_type')
      .eq('tile_id', tileId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing vote
      const { data, error } = await supabase
        .from('tile_likes')
        .update({
          vote_type: type,
          user_name: user
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating vote in Supabase:', error);
        throw error;
      }

      this._cache = null;
      return this._rowToLike(data);
    } else {
      // Insert new vote
      const { data, error } = await supabase
        .from('tile_likes')
        .insert({
          tile_id: tileId,
          user_name: user,
          user_id: userId,
          vote_type: type
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding vote to Supabase:', error);
        throw error;
      }

      this._cache = null;
      return this._rowToLike(data);
    }
  }

  async removeVote(tileId, userId) {
    const { error } = await supabase
      .from('tile_likes')
      .delete()
      .eq('tile_id', tileId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing vote from Supabase:', error);
      throw error;
    }

    this._cache = null;
  }

  invalidateCache() {
    this._cache = null;
  }
}
