import { TileEditor } from './TileEditor';
import { CommentsPanel } from './CommentsPanel';
import { HistoryPanel } from './HistoryPanel';
import styles from './Sidebar.module.css';

export function Sidebar({
  selectedTile,
  tileData,
  comments,
  history,
  activeTab,
  onTabChange,
  onSaveTile,
  onClearTile,
  onAddComment,
  isReadOnly = false
}) {
  return (
    <div className={styles.sidebar}>
      <TileEditor
        selectedTile={selectedTile}
        tileData={tileData}
        onSave={onSaveTile}
        onClear={onClearTile}
        isReadOnly={isReadOnly}
      />

      <div className={styles.section}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'comments' ? styles.active : ''}`}
            onClick={() => onTabChange('comments')}
          >
            Comments
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => onTabChange('history')}
          >
            History
          </button>
        </div>

        <div className={`${styles.tabPanel} ${activeTab === 'comments' ? styles.active : ''}`}>
          <CommentsPanel
            selectedTile={selectedTile}
            comments={comments}
            onAddComment={onAddComment}
            isReadOnly={isReadOnly}
          />
        </div>

        <div className={`${styles.tabPanel} ${activeTab === 'history' ? styles.active : ''}`}>
          <HistoryPanel history={history} />
        </div>
      </div>
    </div>
  );
}
