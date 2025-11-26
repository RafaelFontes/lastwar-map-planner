import styles from './Sidebar.module.css';

export function HistoryPanel({ history }) {
  if (history.length === 0) {
    return (
      <div className={styles.historyList}>
        <p className={styles.hint}>No changes yet</p>
      </div>
    );
  }

  return (
    <div className={styles.historyList}>
      {history.map((item, index) => (
        <div key={index} className={styles.historyItem}>
          <div className={styles.timestamp}>{item.timestamp}</div>
          <div className={styles.action}>{item.action}</div>
          <div className={styles.details}>{item.details}</div>
        </div>
      ))}
    </div>
  );
}
