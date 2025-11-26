import styles from './TileList.module.css';

export function TileList({ labeledTiles, filter, onFilterChange, onTileClick }) {
  return (
    <div className={styles.tileListSection}>
      <div className={styles.tileListHeader}>
        <h2>Labeled Tiles</h2>
        <div className={styles.tileListFilter}>
          <input
            type="text"
            placeholder="Filter by number or name..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.tileListTableContainer}>
        <table className={styles.tileListTable}>
          <thead>
            <tr>
              <th>Number</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {labeledTiles.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan="2">
                  {filter ? 'No matching tiles' : 'No labeled tiles yet'}
                </td>
              </tr>
            ) : (
              labeledTiles.map((tile) => (
                <tr key={tile.id} onClick={() => onTileClick(tile)}>
                  <td>{tile.number !== '' ? tile.number : '-'}</td>
                  <td>{tile.name || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
