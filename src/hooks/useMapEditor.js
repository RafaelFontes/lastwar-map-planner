import { useState, useCallback, useEffect } from 'react';
import { useMapEditorService } from '../di/index.js';
import { DEFAULT_TILE_DATA } from '../data/interfaces.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useProfile } from '../contexts/ProfileContext.jsx';

export function useMapEditor() {
  const mapEditorService = useMapEditorService();
  const { user } = useAuth();
  const { displayName } = useProfile();

  // Get the current user's display name from profile
  const currentUser = displayName || 'Anonymous';

  // Core data state (synced with persistence layer)
  const [tileGeometry, setTileGeometry] = useState(null);
  const [tiles, setTiles] = useState(new Map());
  const [comments, setComments] = useState(new Map());
  const [likes, setLikes] = useState(new Map());
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state
  const [selectedTile, setSelectedTile] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('moves');
  const [tileFilter, setTileFilter] = useState('');

  // Load initial data from persistence layer
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        // Load all data in parallel
        const [geometry, tilesData, commentsData, likesData, historyData] = await Promise.all([
          mapEditorService.loadTileGeometry(),
          mapEditorService.getAllTiles(),
          mapEditorService.getAllComments(),
          mapEditorService.getAllLikes(),
          mapEditorService.getHistory()
        ]);

        setTileGeometry(geometry);
        setTiles(tilesData);
        setComments(commentsData);
        setLikes(likesData);
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

  // Get likes for tile
  const getLikes = useCallback((tileId) => {
    return likes.get(tileId) || [];
  }, [likes]);

  // Get like summary for tile
  const getLikeSummary = useCallback((tileId) => {
    const tileLikes = likes.get(tileId) || [];
    let likeCount = 0;
    let dislikeCount = 0;
    let userVote = null;

    for (const like of tileLikes) {
      if (like.type === 'like') {
        likeCount++;
      } else if (like.type === 'dislike') {
        dislikeCount++;
      }
      if (user?.id && like.userId === user.id) {
        userVote = like.type;
      }
    }

    return { likes: likeCount, dislikes: dislikeCount, userVote };
  }, [likes, user]);

  // Vote on a tile (like or dislike)
  const vote = useCallback(async (tileId, type) => {
    if (!user?.id) return;

    const currentSummary = getLikeSummary(tileId);

    // If clicking the same vote type, remove the vote
    if (currentSummary.userVote === type) {
      // Optimistic update - remove vote
      setLikes(prev => {
        const newLikes = new Map(prev);
        const tileLikes = (newLikes.get(tileId) || []).filter(l => l.userId !== user.id);
        if (tileLikes.length > 0) {
          newLikes.set(tileId, tileLikes);
        } else {
          newLikes.delete(tileId);
        }
        return newLikes;
      });

      try {
        await mapEditorService.removeVote(tileId, user.id);
      } catch (error) {
        console.error('Error removing vote:', error);
        // Refresh likes on error
        const updatedLikes = await mapEditorService.getAllLikes();
        setLikes(updatedLikes);
      }
    } else {
      // Add or change vote
      const newLike = {
        id: `temp-${Date.now()}`,
        user: currentUser,
        userId: user.id,
        type,
        timestamp: new Date().toLocaleString()
      };

      // Optimistic update
      setLikes(prev => {
        const newLikes = new Map(prev);
        const tileLikes = [...(newLikes.get(tileId) || [])];

        // Remove existing vote by this user
        const existingIndex = tileLikes.findIndex(l => l.userId === user.id);
        if (existingIndex >= 0) {
          tileLikes.splice(existingIndex, 1);
        }

        // Add new vote at the beginning
        tileLikes.unshift(newLike);
        newLikes.set(tileId, tileLikes);
        return newLikes;
      });

      try {
        await mapEditorService.vote(tileId, type, currentUser, user.id);
      } catch (error) {
        console.error('Error voting:', error);
        // Refresh likes on error
        const updatedLikes = await mapEditorService.getAllLikes();
        setLikes(updatedLikes);
      }
    }
  }, [user, currentUser, mapEditorService, getLikeSummary]);

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

    // Likes
    getLikes,
    getLikeSummary,
    vote,

    // UI State
    activeTab,
    setActiveTab,
    tileFilter,
    setTileFilter,
    getLabeledTiles,
    currentUser
  };
}
