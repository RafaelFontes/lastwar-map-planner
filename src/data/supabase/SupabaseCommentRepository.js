import { ICommentRepository } from '../interfaces.js';
import { supabase } from '../../lib/supabase.js';

/**
 * Supabase implementation of ICommentRepository
 */
export class SupabaseCommentRepository extends ICommentRepository {
  constructor() {
    super();
    this._cache = null;
  }

  _rowToComment(row) {
    return {
      user: row.user_name,
      text: row.text,
      timestamp: new Date(row.created_at).toLocaleString()
    };
  }

  async getAll() {
    const { data, error } = await supabase
      .from('tile_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments from Supabase:', error);
      return new Map();
    }

    const comments = new Map();
    for (const row of data) {
      const tileComments = comments.get(row.tile_id) || [];
      tileComments.push(this._rowToComment(row));
      comments.set(row.tile_id, tileComments);
    }
    this._cache = comments;
    return new Map(comments);
  }

  async getForTile(tileId) {
    const { data, error } = await supabase
      .from('tile_comments')
      .select('*')
      .eq('tile_id', tileId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments from Supabase:', error);
      return [];
    }

    return data.map(row => this._rowToComment(row));
  }

  async add(tileId, comment) {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('tile_comments')
      .insert({
        tile_id: tileId,
        user_name: comment.user,
        user_id: user?.id || null,
        text: comment.text
      });

    if (error) {
      console.error('Error adding comment to Supabase:', error);
      throw error;
    }

    // Invalidate cache
    this._cache = null;
  }

  async delete(tileId, commentIndex) {
    // Get comments for this tile to find the one at the index
    const { data, error: fetchError } = await supabase
      .from('tile_comments')
      .select('id')
      .eq('tile_id', tileId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching comments from Supabase:', fetchError);
      throw fetchError;
    }

    if (commentIndex >= 0 && commentIndex < data.length) {
      const commentId = data[commentIndex].id;

      const { error } = await supabase
        .from('tile_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment from Supabase:', error);
        throw error;
      }

      // Invalidate cache
      this._cache = null;
    }
  }

  async saveAll(comments) {
    // This would require clearing all and re-inserting
    // For now, just invalidate cache - this method is mainly for migration
    console.warn('saveAll not fully implemented for Supabase comments');
    this._cache = null;
  }

  invalidateCache() {
    this._cache = null;
  }
}
