import { ITileRepository } from '../interfaces.js';
import { supabase } from '../../lib/supabase.js';

/**
 * Supabase implementation of ITileRepository
 */
export class SupabaseTileRepository extends ITileRepository {
  constructor() {
    super();
    this._cache = null;
  }

  _rowToTileData(row) {
    return {
      number: row.number || '',
      name: row.name || '',
      icon: row.icon || '',
      color: row.color || '#f8f9fa',
      comments: row.comments || '',
      labelOffset: row.label_offset_x !== null && row.label_offset_y !== null
        ? { x: row.label_offset_x, y: row.label_offset_y }
        : null
    };
  }

  _tileDataToRow(tileId, data) {
    return {
      tile_id: tileId,
      number: data.number || null,
      name: data.name || null,
      icon: data.icon || null,
      color: data.color || '#f8f9fa',
      comments: data.comments || null,
      label_offset_x: data.labelOffset?.x ?? null,
      label_offset_y: data.labelOffset?.y ?? null,
      updated_at: new Date().toISOString()
    };
  }

  async getAll() {
    const { data, error } = await supabase
      .from('tiles')
      .select('*');

    if (error) {
      console.error('Error loading tiles from Supabase:', error);
      return new Map();
    }

    const tiles = new Map();
    for (const row of data) {
      tiles.set(row.tile_id, this._rowToTileData(row));
    }
    this._cache = tiles;
    return new Map(tiles);
  }

  async get(tileId) {
    const { data, error } = await supabase
      .from('tiles')
      .select('*')
      .eq('tile_id', tileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error loading tile from Supabase:', error);
      return null;
    }

    return this._rowToTileData(data);
  }

  async save(tileId, data) {
    const row = this._tileDataToRow(tileId, data);

    const { error } = await supabase
      .from('tiles')
      .upsert(row, { onConflict: 'tile_id' });

    if (error) {
      console.error('Error saving tile to Supabase:', error);
      throw error;
    }

    // Update cache
    if (this._cache) {
      this._cache.set(tileId, { ...data });
    }
  }

  async delete(tileId) {
    const { error } = await supabase
      .from('tiles')
      .delete()
      .eq('tile_id', tileId);

    if (error) {
      console.error('Error deleting tile from Supabase:', error);
      throw error;
    }

    // Update cache
    if (this._cache) {
      this._cache.delete(tileId);
    }
  }

  async saveAll(tiles) {
    const rows = Array.from(tiles.entries()).map(([tileId, data]) =>
      this._tileDataToRow(tileId, data)
    );

    if (rows.length === 0) return;

    const { error } = await supabase
      .from('tiles')
      .upsert(rows, { onConflict: 'tile_id' });

    if (error) {
      console.error('Error saving tiles to Supabase:', error);
      throw error;
    }

    this._cache = new Map(tiles);
  }

  invalidateCache() {
    this._cache = null;
  }
}
