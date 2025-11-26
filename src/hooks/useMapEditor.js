import { useState, useCallback, useEffect } from 'react';
import { useMapEditorService } from '../di/index.js';
import { DEFAULT_TILE_DATA } from '../data/interfaces.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useMapEditor() {
  const mapEditorService = useMapEditorService();
  const { user } = useAuth();

  // Get the current user's display name from Discord auth
  const currentUser = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || 'Anonymous';

  // Core data state (synced with persistence layer)
  const [tileGeometry, setTileGeometry] = useState(null);
  const [tiles, setTiles] = useState(new Map());
  const [comments, setComments] = useState(new Map());
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state
  const [selectedTile, setSelectedTile] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('comments');
  const [tileFilter, setTileFilter] = useState('');

  // Load initial data from persistence layer
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        // Load all data in parallel
        const [geometry, tilesData, commentsData, historyData] = await Promise.all([
          mapEditorService.loadTileGeometry(),
          mapEditorService.getAllTiles(),
          mapEditorService.getAllComments(),
          mapEditorService.getHistory()
        ]);

        setTileGeometry(geometry);
        setTiles(tilesData);
        setComments(commentsData);
        setHistory(historyData);
        console.log(`Loaded ${geometry.tiles.length} tiles, ${tilesData.size} saved tiles, ${historyData.length} history entries`);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [mapEditorService]);

  // Get tile data by ID
  const getTileData = useCallback((tileId) => {
    return tiles.get(tileId) || { ...DEFAULT_TILE_DATA };
  }, [tiles]);

  // Set tile data (persists to storage)
  const setTileData = useCallback(async (tileId, data) => {
    const oldData = tiles.get(tileId) || { ...DEFAULT_TILE_DATA };

    // Optimistic update
    setTiles(prev => {
      const newTiles = new Map(prev);
      newTiles.set(tileId, { ...data });
      return newTiles;
    });

    try {
      // Persist to storage
      await mapEditorService.saveTileData(tileId, data, oldData);

      // Refresh history from storage
      const updatedHistory = await mapEditorService.getHistory();
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving tile data:', error);
      // Rollback on error
      setTiles(prev => {
        const newTiles = new Map(prev);
        if (oldData && Object.values(oldData).some(v => v)) {
          newTiles.set(tileId, oldData);
        } else {
          newTiles.delete(tileId);
        }
        return newTiles;
      });
    }
  }, [tiles, mapEditorService]);

  // Clear tile data (persists to storage)
  const clearTileData = useCallback(async (tileId) => {
    const oldData = tiles.get(tileId);
    if (!oldData) return;

    // Optimistic update
    setTiles(prev => {
      const newTiles = new Map(prev);
      newTiles.delete(tileId);
      return newTiles;
    });

    try {
      // Persist to storage
      await mapEditorService.clearTileData(tileId);

      // Refresh history from storage
      const updatedHistory = await mapEditorService.getHistory();
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Error clearing tile data:', error);
      // Rollback on error
      if (oldData) {
        setTiles(prev => {
          const newTiles = new Map(prev);
          newTiles.set(tileId, oldData);
          return newTiles;
        });
      }
    }
  }, [tiles, mapEditorService]);

  // Add comment to tile (persists to storage)
  const addComment = useCallback(async (tileId, text) => {
    if (!text.trim()) return;

    const comment = {
      user: currentUser,
      text: text.trim(),
      timestamp: new Date().toLocaleString()
    };

    // Optimistic update
    setComments(prev => {
      const newComments = new Map(prev);
      const tileComments = newComments.get(tileId) || [];
      newComments.set(tileId, [...tileComments, comment]);
      return newComments;
    });

    try {
      // Persist to storage
      await mapEditorService.addComment(tileId, text, currentUser);
    } catch (error) {
      console.error('Error adding comment:', error);
      // Rollback on error
      setComments(prev => {
        const newComments = new Map(prev);
        const tileComments = newComments.get(tileId) || [];
        newComments.set(tileId, tileComments.slice(0, -1));
        return newComments;
      });
    }
  }, [currentUser, mapEditorService]);

  // Get comments for tile
  const getComments = useCallback((tileId) => {
    return comments.get(tileId) || [];
  }, [comments]);

  // Get filtered and sorted labeled tiles
  const getLabeledTiles = useCallback(() => {
    return mapEditorService.getLabeledTiles(tiles, tileFilter);
  }, [tiles, tileFilter, mapEditorService]);

  // Select a tile
  const selectTile = useCallback((tileInfo) => {
    setSelectedTile(tileInfo);
  }, []);

  // Move label offset (persists to storage, no history entry)
  const moveLabelOffset = useCallback(async (tileId, newOffset) => {
    const oldData = tiles.get(tileId) || { ...DEFAULT_TILE_DATA };
    const newData = { ...oldData, labelOffset: newOffset };

    // Optimistic update
    setTiles(prev => {
      const newTiles = new Map(prev);
      newTiles.set(tileId, newData);
      return newTiles;
    });

    try {
      // Persist to storage (silent save, no history)
      await mapEditorService.saveTileDataSilent(tileId, newData);
    } catch (error) {
      console.error('Error saving label offset:', error);
      // Rollback on error
      setTiles(prev => {
        const newTiles = new Map(prev);
        newTiles.set(tileId, oldData);
        return newTiles;
      });
    }
  }, [tiles, mapEditorService]);

  return {
    // Loading state
    isLoading,

    // Data
    tileGeometry,
    tiles,
    history,
    selectedTile,

    // Actions
    getTileData,
    setTileData,
    clearTileData,
    selectTile,
    moveLabelOffset,

    // Comments
    addComment,
    getComments,

    // UI State
    activeTab,
    setActiveTab,
    tileFilter,
    setTileFilter,
    getLabeledTiles,
    currentUser
  };
}
