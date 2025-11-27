import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlanner } from '../../contexts/PlannerContext';
import { useAlliance } from '../../contexts/AllianceContext';
import { useTimeline } from '../../contexts/TimelineContext';

const SPEED_OPTIONS = [
  { label: '0.25x', value: 4000 },
  { label: '0.5x', value: 2000 },
  { label: '1x', value: 1000 },
  { label: '2x', value: 500 },
  { label: '4x', value: 250 },
];

export function PlannerPanel({ tiles }) {
  const {
    isPlannerMode,
    sequence,
    planningAlliance,
    enterPlannerMode,
    exitPlannerMode,
    selectPlannerAlliance,
    addNewDay,
    removeSequenceItem,
    undoPlannedMove,
    clearPlannedMoves,
    getShareUrl,
    // Playback state from context
    isPlaying,
    playIndex,
    setIsPlaying,
    setPlayIndex,
  } = usePlanner();
  const { alliance, allAlliances } = useAlliance();
  const { currentDay } = useTimeline();
  const [copied, setCopied] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // Default 1s
  const playIntervalRef = useRef(null);
  const speedRef = useRef(playbackSpeed);

  // Keep speed ref in sync
  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Clear interval helper
  const clearPlayInterval = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  // Start interval helper
  const startPlayInterval = useCallback(() => {
    clearPlayInterval();
    playIntervalRef.current = setInterval(() => {
      setPlayIndex(prev => {
        if (prev >= sequence.length - 1) {
          setIsPlaying(false);
          clearPlayInterval();
          return prev; // Stay at last item
        }
        return prev + 1;
      });
    }, speedRef.current);
  }, [sequence.length, setPlayIndex, setIsPlaying, clearPlayInterval]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => clearPlayInterval();
  }, [clearPlayInterval]);

  // Restart interval when speed changes while playing
  useEffect(() => {
    if (isPlaying) {
      startPlayInterval();
    }
  }, [playbackSpeed, isPlaying, startPlayInterval]);

  // Stop when playback reaches end
  useEffect(() => {
    if (playIndex >= sequence.length && sequence.length > 0) {
      setIsPlaying(false);
      setPlayIndex(sequence.length - 1);
      clearPlayInterval();
    }
  }, [playIndex, sequence.length, setIsPlaying, setPlayIndex, clearPlayInterval]);

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    if (sequence.length === 0) return;

    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      clearPlayInterval();
    } else {
      // Play - start from beginning if at end or not started
      const startIdx = playIndex < 0 || playIndex >= sequence.length - 1 ? 0 : playIndex;
      setPlayIndex(startIdx);
      setIsPlaying(true);
      startPlayInterval();
    }
  }, [sequence.length, isPlaying, playIndex, setIsPlaying, setPlayIndex, clearPlayInterval, startPlayInterval]);

  // Stop playback and reset
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setPlayIndex(-1);
    clearPlayInterval();
  }, [setIsPlaying, setPlayIndex, clearPlayInterval]);

  // Step backward
  const handleStepBackward = useCallback(() => {
    if (sequence.length === 0) return;
    setPlayIndex(prev => Math.max(0, Math.max(0, prev) - 1));
  }, [sequence.length, setPlayIndex]);

  // Step forward
  const handleStepForward = useCallback(() => {
    if (sequence.length === 0) return;
    setPlayIndex(prev => Math.min(sequence.length - 1, (prev < 0 ? 0 : prev + 1)));
  }, [sequence.length, setPlayIndex]);

  // Seek to position (progress bar click)
  const handleSeek = useCallback((e) => {
    if (sequence.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newIndex = Math.round(percent * (sequence.length - 1));
    setPlayIndex(Math.max(0, Math.min(sequence.length - 1, newIndex)));
  }, [sequence.length, setPlayIndex]);

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!alliance) {
    return (
      <div className="text-discord-text-muted text-sm italic">
        Join an alliance to use the planner
      </div>
    );
  }

  if (!isPlannerMode) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-discord-text-secondary text-sm">
          Planner mode lets you experiment with tile claims without affecting the actual map.
          Perfect for planning your next moves!
        </p>
        <button
          onClick={enterPlannerMode}
          className="px-4 py-2.5 bg-discord-blurple text-white rounded text-sm font-medium hover:bg-discord-blurple-hover transition-colors"
        >
          Enter Planner Mode
        </button>
      </div>
    );
  }

  // Get alliance info for display
  const getAllianceInfo = (allianceId) => {
    return allAlliances.find(a => a.id === allianceId) || { name: 'Unknown', color: '#666' };
  };

  // Get tile level (number) for display
  const getTileLevel = (tileId) => {
    const tileData = tiles?.get(tileId);
    return tileData?.number ?? tileId;
  };

  // Count moves by day (split by new_day markers)
  // Start from current day, each new_day marker advances to the next day
  // Also track claims per alliance per day segment
  const MAX_CLAIMS_PER_DAY = 3;

  // First pass: identify day boundaries and count claims per alliance per day
  const dayBoundaries = [0]; // indices where new days start
  sequence.forEach((item, index) => {
    if (item.type === 'new_day') {
      dayBoundaries.push(index + 1);
    }
  });

  // Calculate claims per alliance for each day segment
  const claimsPerDayPerAlliance = {};
  let currentDayIdx = 0;
  let currentDayNum = currentDay;

  sequence.forEach((item, index) => {
    if (item.type === 'new_day') {
      currentDayIdx++;
      currentDayNum++;
    } else if (item.type === 'move' && item.action === 'claim') {
      const dayKey = currentDayNum;
      if (!claimsPerDayPerAlliance[dayKey]) {
        claimsPerDayPerAlliance[dayKey] = {};
      }
      if (!claimsPerDayPerAlliance[dayKey][item.allianceId]) {
        claimsPerDayPerAlliance[dayKey][item.allianceId] = 0;
      }
      claimsPerDayPerAlliance[dayKey][item.allianceId]++;
    }
  });

  // Build sequence with day info and claim counts
  let dayNumber = currentDay;
  let claimCountsForCurrentDay = {}; // track running counts per alliance for current day segment
  const sequenceWithDays = sequence.map((item, index) => {
    if (item.type === 'new_day') {
      // Get the summary for the day that just ended
      const prevDaySummary = claimsPerDayPerAlliance[dayNumber] || {};
      dayNumber++;
      claimCountsForCurrentDay = {}; // reset for new day
      return { ...item, dayNumber: dayNumber, daySummary: prevDaySummary };
    }
    // Track running count for this alliance in current day
    if (item.action === 'claim') {
      if (!claimCountsForCurrentDay[item.allianceId]) {
        claimCountsForCurrentDay[item.allianceId] = 0;
      }
      claimCountsForCurrentDay[item.allianceId]++;
    }
    const allianceClaimsToday = claimCountsForCurrentDay[item.allianceId] || 0;
    const isOverLimit = item.action === 'claim' && allianceClaimsToday > MAX_CLAIMS_PER_DAY;
    return { ...item, dayNumber: dayNumber, stepNumber: index + 1, isOverLimit };
  });

  // Get the summary for the current (last) day segment
  const currentDaySummary = claimsPerDayPerAlliance[dayNumber] || {};

  // Render alliance claims summary as colored dots/counts
  const renderClaimsSummary = (summary, dayNum) => {
    const entries = Object.entries(summary);
    if (entries.length === 0) return null;

    return (
      <div className="flex items-center gap-1 ml-2">
        {entries.map(([allianceId, count]) => {
          const allianceInfo = getAllianceInfo(allianceId);
          const isOverLimit = count > MAX_CLAIMS_PER_DAY;
          return (
            <div
              key={allianceId}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${
                isOverLimit ? 'bg-red-500/30 ring-1 ring-red-500' : 'bg-discord-dark/50'
              }`}
              title={`${allianceInfo.name}: ${count}/${MAX_CLAIMS_PER_DAY} claims`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: allianceInfo.color }}
              />
              <span className={`font-mono font-bold ${isOverLimit ? 'text-red-400' : 'text-discord-text'}`}>
                {count}/{MAX_CLAIMS_PER_DAY}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Planner Mode Banner */}
      <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-400 text-lg">📋</span>
          <span className="font-semibold text-yellow-400">Planner Mode Active</span>
        </div>
        <p className="text-xs text-discord-text-secondary">
          Changes are local only. Click tiles to plan claims.
        </p>
      </div>

      {/* Alliance Selector */}
      <div>
        <label className="block mb-1.5 text-xs font-medium text-discord-text-secondary">
          Planning for Alliance:
        </label>
        <select
          value={planningAlliance?.id || ''}
          onChange={(e) => selectPlannerAlliance(e.target.value || null)}
          className="w-full px-3 py-2 bg-discord-dark border border-discord-lighter-gray rounded text-sm text-discord-text focus:outline-none focus:border-discord-blurple"
        >
          {alliance && (
            <option value="">My Alliance ({alliance.name})</option>
          )}
          {allAlliances.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {planningAlliance && (
          <div className="mt-2 flex items-center gap-2 text-xs text-discord-text-muted">
            <span
              className="w-3 h-3 rounded-full border border-discord-lighter-gray"
              style={{ backgroundColor: planningAlliance.color }}
            />
            <span>Claims will use this alliance's color</span>
          </div>
        )}
      </div>

      {/* Sequencer */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-discord-text-secondary">
            Sequencer ({sequence.length} steps)
          </h4>
          <button
            onClick={addNewDay}
            className="px-2 py-1 text-xs bg-discord-blurple/20 text-discord-blurple rounded hover:bg-discord-blurple/30 transition-colors"
          >
            + New Day
          </button>
        </div>

        {/* Playback Controls */}
        {sequence.length > 0 && (
          <div className="mb-3 p-2 bg-discord-dark/50 rounded-lg">
            {/* Progress Bar */}
            <div
              className="h-2 bg-discord-lighter-gray rounded-full mb-2 cursor-pointer relative overflow-hidden"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-discord-blurple rounded-full transition-all duration-150"
                style={{
                  width: playIndex >= 0
                    ? `${((playIndex + 1) / sequence.length) * 100}%`
                    : '0%'
                }}
              />
              {/* Tick marks for each step */}
              <div className="absolute inset-0 flex justify-between px-0.5">
                {sequence.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-0.5 h-full ${
                      idx <= playIndex ? 'bg-discord-blurple-hover' : 'bg-discord-gray/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-1">
              {/* Stop/Reset */}
              <button
                onClick={handleStop}
                className="p-1.5 text-discord-text-muted hover:text-discord-text rounded hover:bg-discord-lighter-gray transition-colors"
                title="Stop and reset"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>

              {/* Step Backward */}
              <button
                onClick={handleStepBackward}
                disabled={playIndex <= 0}
                className="p-1.5 text-discord-text-muted hover:text-discord-text rounded hover:bg-discord-lighter-gray transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous step"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className={`p-2 rounded-full transition-colors ${
                  isPlaying
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Step Forward */}
              <button
                onClick={handleStepForward}
                disabled={playIndex >= sequence.length - 1}
                className="p-1.5 text-discord-text-muted hover:text-discord-text rounded hover:bg-discord-lighter-gray transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next step"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 6h-2v12h2V6zM8 6l8.5 6L8 18V6z" />
                </svg>
              </button>

              {/* Spacer */}
              <div className="w-2" />

              {/* Speed Control */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-1.5 py-1 bg-discord-lighter-gray border-none rounded text-xs text-discord-text focus:outline-none focus:ring-1 focus:ring-discord-blurple cursor-pointer"
                title="Playback speed"
              >
                {SPEED_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Current position indicator */}
            <div className="text-center text-xs text-discord-text-muted mt-1.5">
              {playIndex >= 0 ? (
                <span>Step {playIndex + 1} of {sequence.length}</span>
              ) : (
                <span>Ready to play</span>
              )}
            </div>
          </div>
        )}

        {/* Current day summary - show at top if there are moves */}
        {sequence.length > 0 && Object.keys(currentDaySummary).length > 0 && (
          <div className="mb-2 p-2 bg-discord-dark/50 rounded flex items-center justify-between">
            <span className="text-xs text-discord-text-secondary font-medium">
              Day {dayNumber} (current):
            </span>
            {renderClaimsSummary(currentDaySummary, dayNumber)}
          </div>
        )}

        {sequence.length === 0 ? (
          <p className="text-discord-text-muted text-sm italic">
            No planned actions yet. Click tiles to add claims/unclaims.
          </p>
        ) : (
          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
            {sequenceWithDays.map((item, index) => {
              const isCurrentlyPlaying = isPlaying && playIndex === index;

              if (item.type === 'new_day') {
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col py-2 px-3 rounded transition-all duration-200 ${
                      isCurrentlyPlaying
                        ? 'bg-yellow-500/30 border-2 border-yellow-500 ring-2 ring-yellow-500/50'
                        : 'bg-discord-blurple/20 border border-discord-blurple/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-discord-blurple font-bold text-xs">📅</span>
                        <span className="text-sm font-semibold text-discord-blurple">
                          Day {item.dayNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => removeSequenceItem(item.id)}
                        className="text-discord-text-muted hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {/* Show summary for the previous day that just ended */}
                    {item.daySummary && Object.keys(item.daySummary).length > 0 && (
                      <div className="flex items-center mt-1.5 pt-1.5 border-t border-discord-blurple/20">
                        <span className="text-xs text-discord-text-muted mr-1">Day {item.dayNumber - 1}:</span>
                        {renderClaimsSummary(item.daySummary, item.dayNumber - 1)}
                      </div>
                    )}
                  </div>
                );
              }

              const allianceInfo = getAllianceInfo(item.allianceId);
              const isClaim = item.action === 'claim';

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-2 px-3 rounded group transition-all duration-200 ${
                    isCurrentlyPlaying
                      ? 'bg-yellow-500/30 border-2 border-yellow-500 ring-2 ring-yellow-500/50'
                      : item.isOverLimit
                        ? 'bg-red-500/20 border border-red-500/50'
                        : 'bg-discord-dark'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-discord-text-muted text-xs font-mono w-5">
                      {index + 1}.
                    </span>
                    {item.isOverLimit && (
                      <span className="text-red-400" title="Over daily limit (3 claims max)">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    <span
                      className={`text-sm font-medium ${isClaim ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {isClaim ? 'Claim' : 'Unclaim'}
                    </span>
                    <span className="text-discord-text text-sm font-semibold">
                      L{getTileLevel(item.tileId)}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full border border-discord-lighter-gray"
                      style={{ backgroundColor: allianceInfo.color }}
                      title={allianceInfo.name}
                    />
                  </div>
                  <button
                    onClick={() => removeSequenceItem(item.id)}
                    className="text-discord-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {sequence.length > 0 && (
          <>
            <button
              onClick={undoPlannedMove}
              className="px-3 py-2 bg-discord-lighter-gray text-discord-text rounded text-sm hover:bg-discord-lightest-gray transition-colors"
            >
              Undo Last Step
            </button>
            <button
              onClick={handleCopyShareUrl}
              className="px-3 py-2 bg-discord-lighter-gray text-discord-text rounded text-sm hover:bg-discord-lightest-gray transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Share URL'}
            </button>
            <button
              onClick={clearPlannedMoves}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
            >
              Clear All
            </button>
          </>
        )}
        <button
          onClick={exitPlannerMode}
          className="px-3 py-2 bg-discord-lighter-gray text-discord-text rounded text-sm hover:bg-discord-lightest-gray transition-colors"
        >
          Exit Planner Mode
        </button>
      </div>
    </div>
  );
}
