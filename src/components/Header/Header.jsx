import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

export function Header({ scale, onZoom }) {
  const { user, loading, signInWithDiscord, signOut, isSupabaseConfigured } = useAuth();
  const zoomLevel = Math.round(scale * 100);

  return (
    <header className={styles.header}>
      <h1>Season 0 Map Editor</h1>
      <div className={styles.controls}>
        <div className={styles.zoomControls}>
          <button
            className={styles.btnZoom}
            onClick={() => onZoom('out')}
            title="Zoom Out"
          >
            −
          </button>
          <span className={styles.zoomLevel}>{zoomLevel}%</span>
          <button
            className={styles.btnZoom}
            onClick={() => onZoom('in')}
            title="Zoom In"
          >
            +
          </button>
          <button
            className={styles.btnZoomReset}
            onClick={() => onZoom('reset')}
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
        {isSupabaseConfigured && (
          <div className={styles.authControls}>
            {loading ? (
              <span className={styles.authLoading}>...</span>
            ) : user ? (
              <>
                <span className={styles.userName}>
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button className={styles.btnAuth} onClick={signOut}>
                  Sign Out
                </button>
              </>
            ) : (
              <button className={styles.btnDiscord} onClick={signInWithDiscord}>
                Sign in with Discord
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
