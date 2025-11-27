import { useGameState } from '../../contexts/GameStateContext';
import { useAlliance } from '../../contexts/AllianceContext';
import { useTimeline } from '../../contexts/TimelineContext';
import { useToast } from '../../contexts/ToastContext';

export function MovesPanel() {
  const { movesInfo, userMoves, undoMove } = useGameState();
  const { alliance } = useAlliance();
  const { isViewingCurrentDay } = useTimeline();
  const { toast } = useToast();

  if (!alliance) {
    return (
      <div className="text-discord-text-muted text-sm italic">
        Join an alliance to track moves
      </div>
    );
  }

  if (!isViewingCurrentDay) {
    return (
      <div className="text-discord-text-muted text-sm italic">
        Move tracking only available for current day
      </div>
    );
  }

  const handleUndo = async (moveId) => {
    const result = await undoMove(moveId);
    if (!result.success) {
      toast.error(result.error || 'Failed to undo move');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Moves Counter */}
      <div className="flex items-center justify-between p-3 bg-discord-dark rounded-lg">
        <div className="flex flex-col">
          <span className="text-xs text-discord-text-muted uppercase tracking-wide">Moves Today</span>
          <span className="text-lg font-bold text-discord-text">
            {movesInfo.movesUsed} / {movesInfo.maxMoves}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-discord-text-muted">Remaining</span>
          <span className={`text-lg font-bold ${movesInfo.movesRemaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {movesInfo.movesRemaining}
          </span>
        </div>
      </div>

      {/* Your Moves */}
      <div>
        <h4 className="text-sm font-semibold text-discord-text-secondary mb-2">Your Moves Today</h4>
        {!Array.isArray(userMoves) || userMoves.length === 0 ? (
          <p className="text-discord-text-muted text-sm italic">No moves made today</p>
        ) : (
          <div className="flex flex-col gap-2">
            {userMoves.map((move) => (
              <MoveItem
                key={move.id}
                move={move}
                onUndo={() => handleUndo(move.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MoveItem({ move, onUndo }) {
  const isUndone = move.undone;
  const actionLabel = move.action === 'claim' ? 'Claimed' : 'Cleared';
  const time = new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex items-center justify-between p-2 rounded ${isUndone ? 'bg-discord-lighter-gray opacity-50' : 'bg-discord-dark'}`}>
      <div className="flex flex-col">
        <span className={`text-sm ${isUndone ? 'line-through text-discord-text-muted' : 'text-discord-text'}`}>
          {actionLabel} Tile #{move.tile_id}
        </span>
        <span className="text-xs text-discord-text-muted">{time}</span>
      </div>
      {!isUndone && move.action === 'claim' && (
        <button
          onClick={onUndo}
          className="px-2 py-1 text-xs bg-discord-lighter-gray text-discord-text rounded hover:bg-discord-lightest-gray transition-colors"
        >
          Undo
        </button>
      )}
      {isUndone && (
        <span className="text-xs text-discord-text-muted italic">Undone</span>
      )}
    </div>
  );
}
