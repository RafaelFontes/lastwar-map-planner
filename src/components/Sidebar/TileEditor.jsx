import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: '🏰', label: 'Castle 🏰' },
  { value: '⚔️', label: 'Sword ⚔️' },
  { value: '🛡️', label: 'Shield 🛡️' },
  { value: '👑', label: 'Crown 👑' },
  { value: '💎', label: 'Gem 💎' },
  { value: '🔥', label: 'Fire 🔥' },
  { value: '⭐', label: 'Star ⭐' },
  { value: '🎯', label: 'Target 🎯' }
];

export function TileEditor({ selectedTile, tileData, onSave, onClear, isReadOnly = false }) {
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    icon: '',
    color: '#f8f9fa',
    comments: ''
  });

  // Sync form data when tile selection changes
  useEffect(() => {
    if (selectedTile) {
      setFormData({
        number: tileData.number || '',
        name: tileData.name || '',
        icon: tileData.icon || '',
        color: tileData.color || '#f8f9fa',
        comments: tileData.comments || ''
      });
    }
  }, [selectedTile, tileData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(selectedTile.id, formData);
  };

  const handleClear = () => {
    onClear(selectedTile.id);
    setFormData({
      number: '',
      name: '',
      icon: '',
      color: '#f8f9fa',
      comments: ''
    });
  };

  if (!selectedTile) {
    return (
      <div className={styles.section}>
        <h2>Tile Editor</h2>
        <div className={styles.tileInfo}>
          <p className={styles.hint}>
            {isReadOnly ? 'Sign in with Discord to edit tiles' : 'Click on a tile to edit'}
          </p>
        </div>
      </div>
    );
  }

  if (isReadOnly) {
    return (
      <div className={styles.section}>
        <h2>Tile Viewer</h2>
        <div className={styles.tileEditor}>
          <div className={styles.formGroup}>
            <label>Number:</label>
            <span className={styles.readOnlyValue}>{tileData.number || '-'}</span>
          </div>
          <div className={styles.formGroup}>
            <label>Name:</label>
            <span className={styles.readOnlyValue}>{tileData.name || '-'}</span>
          </div>
          <div className={styles.formGroup}>
            <label>Icon:</label>
            <span className={styles.readOnlyValue}>{tileData.icon || '-'}</span>
          </div>
          <div className={styles.formGroup}>
            <label>Color:</label>
            <span className={styles.readOnlyValue} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '20px', height: '20px', backgroundColor: tileData.color || '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px' }}></span>
              {tileData.color || '#f8f9fa'}
            </span>
          </div>
          {tileData.comments && (
            <div className={styles.formGroup}>
              <label>Notes:</label>
              <p className={styles.readOnlyValue}>{tileData.comments}</p>
            </div>
          )}
          <p className={styles.hint}>Sign in with Discord to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h2>Tile Editor</h2>
      <div className={styles.tileEditor}>
        <div className={styles.formGroup}>
          <label htmlFor="tileNumber">Number:</label>
          <input
            type="number"
            id="tileNumber"
            min="0"
            max="99"
            value={formData.number}
            onChange={(e) => handleChange('number', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tileName">Name:</label>
          <input
            type="text"
            id="tileName"
            placeholder="Enter tile name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tileIcon">Icon:</label>
          <select
            id="tileIcon"
            value={formData.icon}
            onChange={(e) => handleChange('icon', e.target.value)}
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tileColor">Tile Color:</label>
          <input
            type="color"
            id="tileColor"
            value={formData.color}
            onChange={(e) => handleChange('color', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tileComments">Comments:</label>
          <textarea
            id="tileComments"
            placeholder="Add notes about this tile..."
            rows="3"
            value={formData.comments}
            onChange={(e) => handleChange('comments', e.target.value)}
          />
        </div>

        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave}>
          Save Tile
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleClear}>
          Clear Tile
        </button>
      </div>
    </div>
  );
}
