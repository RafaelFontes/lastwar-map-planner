export function HistoryPanel({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="max-h-[300px] overflow-y-auto mb-4">
        <p className="text-discord-text-muted italic text-sm">No claim history yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto mb-4">
      {history.map((item, index) => (
        <HistoryItem key={index} item={item} />
      ))}
    </div>
  );
}

function HistoryItem({ item }) {
  const { action, user, allianceName, allianceColor, tileId, timestamp } = item;

  // Format: [Alliance] User claimed tile L1
  const actionVerb = action === 'claim' ? 'claimed' : 'unclaimed';
  const tileLabel = tileId ? `L${tileId}` : '';

  return (
    <div className="p-3 mb-2 last:mb-0 bg-discord-light-gray rounded text-sm">
      <div className="text-discord-text-muted text-[11px] mb-1">{timestamp}</div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {allianceName && (
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full inline-block border border-discord-lighter-gray"
              style={{ backgroundColor: allianceColor || '#666' }}
            />
            <span className="font-semibold text-discord-text">[{allianceName}]</span>
          </span>
        )}
        <span className="text-discord-text-secondary">
          {user} {actionVerb} tile {tileLabel}
        </span>
      </div>
    </div>
  );
}
