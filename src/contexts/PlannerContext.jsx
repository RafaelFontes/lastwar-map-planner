import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useGameState } from './GameStateContext';
import { useAlliance } from './AllianceContext';

const PlannerContext = createContext({});

/**
 * Encode planner state for URL sharing
 * Supports: claim (c), clear (x), new_day (d)
 */
function encodePlannerState(sequence) {
  if (sequence.length === 0) return '';

  // Format: action:tileId:allianceId or d for new_day
  // Use 'c' for claim, 'x' for clear (can't use first char since both start with 'c')
  const encoded = sequence
    .map(m => {
      if (m.type === 'new_day') return 'd';
      const actionCode = m.action === 'claim' ? 'c' : 'x';
      return `${actionCode}:${m.tileId}:${m.allianceId}`;
    })
    .join(',');

  return btoa(encoded);
}

/**
 * Decode planner state from URL
 */
function decodePlannerState(encoded) {
  if (!encoded) return [];

  try {
    const decoded = atob(encoded);
    return decoded.split(',').map((part, index) => {
      if (part === 'd') {
        return { id: `day-${index}`, type: 'new_day' };
      }
      const [action, tileId, allianceId] = part.split(':');
      return {
        id: `move-${index}`,
        type: 'move',
        action: action === 'c' ? 'claim' : 'clear',
        tileId: parseInt(tileId, 10),
        allianceId,
      };
    });
  } catch (e) {
    console.error('Failed to decode planner state:', e);
    return [];
  }
}

/**
 * Get URL parameter
 */
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Set URL parameter without page reload
 */
function setUrlParam(name, value) {
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(name, value);
  } else {
    url.searchParams.delete(name);
  }
  window.history.replaceState({}, '', url.toString());
}

let sequenceIdCounter = 0;
function generateId() {
  return `seq-${Date.now()}-${sequenceIdCounter++}`;
}

export function PlannerProvider({ children }) {
  const { tileClaims } = useGameState();
  const { alliance, allAlliances } = useAlliance();

  // Planner mode state
  const [isPlannerMode, setIsPlannerMode] = useState(false);
  const [sequence, setSequence] = useState([]); // Array of {id, type, action?, tileId?, allianceId?}
  const [selectedPlannerAlliance, setSelectedPlannerAlliance] = useState(null);

  // Playback state - shared so map can use it
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(-1);

  // Initialize from URL on first render
  useState(() => {
    const encoded = getUrlParam('plan');
    if (encoded) {
      const decoded = decodePlannerState(encoded);
      if (decoded.length > 0) {
        setSequence(decoded);
        setIsPlannerMode(true);
      }
    }
  });

  // The alliance to use for planning (selected or user's own)
  const planningAlliance = selectedPlannerAlliance || alliance;

  // Extract just the moves (not new_day entries) for tile claims computation
  const plannedMoves = useMemo(() => {
    return sequence.filter(item => item.type === 'move');
  }, [sequence]);

  // Compute planned tile claims (original + planned moves)
  const plannedTileClaims = useMemo(() => {
    if (!isPlannerMode) return tileClaims;

    // Start with a copy of current claims
    const claims = new Map(tileClaims);

    // Apply planned moves (in sequence order)
    for (const item of sequence) {
      if (item.type !== 'move') continue;

      if (item.action === 'claim') {
        // Find alliance details
        const moveAlliance = allAlliances.find(a => a.id === item.allianceId);
        if (moveAlliance) {
          claims.set(item.tileId, {
            allianceId: item.allianceId,
            allianceName: moveAlliance.name,
            color: moveAlliance.color,
            isPlanned: true,
          });
        }
      } else if (item.action === 'clear') {
        claims.delete(item.tileId);
      }
    }

    return claims;
  }, [isPlannerMode, tileClaims, sequence, allAlliances]);

  // Compute playback tile claims (only up to current playIndex)
  const playbackTileClaims = useMemo(() => {
    if (!isPlannerMode || !isPlaying || playIndex < 0) return null;

    // Start with a copy of current claims
    const claims = new Map(tileClaims);

    // Apply planned moves only up to and including playIndex
    for (let i = 0; i <= playIndex && i < sequence.length; i++) {
      const item = sequence[i];
      if (item.type !== 'move') continue;

      if (item.action === 'claim') {
        const moveAlliance = allAlliances.find(a => a.id === item.allianceId);
        if (moveAlliance) {
          claims.set(item.tileId, {
            allianceId: item.allianceId,
            allianceName: moveAlliance.name,
            color: moveAlliance.color,
            isPlanned: true,
          });
        }
      } else if (item.action === 'clear') {
        claims.delete(item.tileId);
      }
    }

    return claims;
  }, [isPlannerMode, isPlaying, playIndex, tileClaims, sequence, allAlliances]);

  // Get the tile being highlighted during playback
  const playbackHighlightTileId = useMemo(() => {
    if (!isPlaying || playIndex < 0 || playIndex >= sequence.length) return null;
    const item = sequence[playIndex];
    return item.type === 'move' ? item.tileId : null;
  }, [isPlaying, playIndex, sequence]);

  // Enter planner mode
  const enterPlannerMode = useCallback(() => {
    setIsPlannerMode(true);
    setSequence([]);
    setSelectedPlannerAlliance(null);
    setUrlParam('plan', null);
  }, []);

  // Exit planner mode
  const exitPlannerMode = useCallback(() => {
    setIsPlannerMode(false);
    setSequence([]);
    setSelectedPlannerAlliance(null);
    setUrlParam('plan', null);
  }, []);

  // Select alliance for planning
  const selectPlannerAlliance = useCallback((allianceId) => {
    const found = allAlliances.find(a => a.id === allianceId);
    setSelectedPlannerAlliance(found || null);
  }, [allAlliances]);

  // Add a planned claim to the sequence
  const planClaim = useCallback((tileId) => {
    if (!planningAlliance) return;

    setSequence(prev => {
      const newSequence = [...prev, {
        id: generateId(),
        type: 'move',
        action: 'claim',
        tileId,
        allianceId: planningAlliance.id,
      }];

      setUrlParam('plan', encodePlannerState(newSequence));
      return newSequence;
    });
  }, [planningAlliance]);

  // Add a planned clear to the sequence
  const planClear = useCallback((tileId) => {
    // Get the current owner of the tile (could be from original claims or a previous planned claim)
    const currentClaim = plannedTileClaims.get(tileId);
    if (!currentClaim) return; // Nothing to clear

    setSequence(prev => {
      const newSequence = [...prev, {
        id: generateId(),
        type: 'move',
        action: 'clear',
        tileId,
        allianceId: currentClaim.allianceId,
      }];

      setUrlParam('plan', encodePlannerState(newSequence));
      return newSequence;
    });
  }, [plannedTileClaims]);

  // Add a new day marker to the sequence
  const addNewDay = useCallback(() => {
    setSequence(prev => {
      const newSequence = [...prev, {
        id: generateId(),
        type: 'new_day',
      }];

      setUrlParam('plan', encodePlannerState(newSequence));
      return newSequence;
    });
  }, []);

  // Remove a specific item from the sequence
  const removeSequenceItem = useCallback((itemId) => {
    setSequence(prev => {
      const newSequence = prev.filter(item => item.id !== itemId);
      setUrlParam('plan', encodePlannerState(newSequence));
      return newSequence;
    });
  }, []);

  // Undo last sequence item
  const undoPlannedMove = useCallback(() => {
    setSequence(prev => {
      const newSequence = prev.slice(0, -1);
      setUrlParam('plan', encodePlannerState(newSequence));
      return newSequence;
    });
  }, []);

  // Clear all planned moves
  const clearPlannedMoves = useCallback(() => {
    setSequence([]);
    setUrlParam('plan', null);
  }, []);

  // Get share URL
  const getShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('plan', encodePlannerState(sequence));
    return url.toString();
  }, [sequence]);

  // Check if a tile is planned (has a planned move)
  const isPlannedTile = useCallback((tileId) => {
    return plannedMoves.some(m => m.tileId === tileId);
  }, [plannedMoves]);

  // Get claim info for a planned tile
  const getPlannedTileClaim = useCallback((tileId) => {
    return plannedTileClaims.get(tileId) || null;
  }, [plannedTileClaims]);

  const value = {
    isPlannerMode,
    sequence,
    plannedMoves,
    plannedTileClaims,
    planningAlliance,
    selectedPlannerAlliance,
    enterPlannerMode,
    exitPlannerMode,
    selectPlannerAlliance,
    planClaim,
    planClear,
    addNewDay,
    removeSequenceItem,
    undoPlannedMove,
    clearPlannedMoves,
    getShareUrl,
    isPlannedTile,
    getPlannedTileClaim,
    // Playback state
    isPlaying,
    playIndex,
    setIsPlaying,
    setPlayIndex,
    playbackTileClaims,
    playbackHighlightTileId,
  };

  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (context === undefined) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}
