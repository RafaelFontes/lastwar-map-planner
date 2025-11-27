import { TileEditor } from './TileEditor';
import { HistoryPanel } from './HistoryPanel';
import { LikeButton } from './LikeButton';
import { LikeHistory } from './LikeHistory';
import { MovesPanel } from './MovesPanel';
import { PlannerPanel } from './PlannerPanel';
import { AdminPanel } from '../AdminPanel/AdminPanel';

export function Sidebar({
  selectedTile,
  tileData,
  tiles,
  likes,
  likeSummary,
  history,
  activeTab,
  onTabChange,
  onVote,
  isReadOnly = false
}) {
  return (
    <div className="w-[320px] max-lg:w-[280px] max-md:w-full max-md:h-[40vh] max-md:border-l-0 max-md:border-t max-md:border-t-discord-lighter-gray flex flex-col border-l border-discord-lighter-gray bg-discord-gray overflow-y-auto shrink-0">
      <AdminPanel />
      <TileEditor
        selectedTile={selectedTile}
        tileData={tileData}
        likeSummary={likeSummary}
        onVote={onVote}
        isReadOnly={isReadOnly}
      />

      <div className="p-4 pt-5 border-b border-discord-lighter-gray last:flex-1 last:border-b-0">
        <div className="flex gap-0 mb-4 border-b-2 border-discord-lighter-gray">
          <button
            className={`flex-1 px-3 py-2.5 border-none bg-transparent text-sm font-medium cursor-pointer transition-all duration-200 border-b-2 -mb-0.5 ${
              activeTab === 'moves'
                ? 'text-discord-blurple border-discord-blurple'
                : 'text-discord-text-muted border-transparent hover:text-discord-blurple'
            }`}
            onClick={() => onTabChange('moves')}
          >
            Moves
          </button>
          <button
            className={`flex-1 px-3 py-2.5 border-none bg-transparent text-sm font-medium cursor-pointer transition-all duration-200 border-b-2 -mb-0.5 ${
              activeTab === 'planner'
                ? 'text-discord-blurple border-discord-blurple'
                : 'text-discord-text-muted border-transparent hover:text-discord-blurple'
            }`}
            onClick={() => onTabChange('planner')}
          >
            Planner
          </button>
          <button
            className={`flex-1 px-3 py-2.5 border-none bg-transparent text-sm font-medium cursor-pointer transition-all duration-200 border-b-2 -mb-0.5 ${
              activeTab === 'likes'
                ? 'text-discord-blurple border-discord-blurple'
                : 'text-discord-text-muted border-transparent hover:text-discord-blurple'
            }`}
            onClick={() => onTabChange('likes')}
          >
            Votes
          </button>
          <button
            className={`flex-1 px-3 py-2.5 border-none bg-transparent text-sm font-medium cursor-pointer transition-all duration-200 border-b-2 -mb-0.5 ${
              activeTab === 'history'
                ? 'text-discord-blurple border-discord-blurple'
                : 'text-discord-text-muted border-transparent hover:text-discord-blurple'
            }`}
            onClick={() => onTabChange('history')}
          >
            History
          </button>
        </div>

        <div className={activeTab === 'moves' ? 'block' : 'hidden'}>
          <MovesPanel />
        </div>

        <div className={activeTab === 'planner' ? 'block' : 'hidden'}>
          <PlannerPanel tiles={tiles} />
        </div>

        <div className={activeTab === 'likes' ? 'block' : 'hidden'}>
          {selectedTile ? (
            <LikeHistory likes={likes} />
          ) : (
            <p className="text-discord-text-muted italic text-sm">
              Select a tile to see votes
            </p>
          )}
        </div>

        <div className={activeTab === 'history' ? 'block' : 'hidden'}>
          <HistoryPanel history={history} />
        </div>
      </div>
    </div>
  );
}
