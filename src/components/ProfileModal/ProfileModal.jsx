import { useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';

const inputClasses = "w-full px-3 py-2 border border-discord-lighter-gray rounded text-sm bg-discord-dark text-discord-text transition-colors duration-200 focus:outline-none focus:border-discord-blurple focus:ring-2 focus:ring-discord-blurple/20";

export function ProfileModal() {
  const { showProfileModal, saveProfile, profile } = useProfile();
  const [allianceName, setAllianceName] = useState(profile?.alliance_name || '');
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!showProfileModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allianceName.trim()) {
      setError('Alliance name is required');
      return;
    }

    if (!nickname.trim()) {
      setError('Nickname is required');
      return;
    }

    setSaving(true);
    const result = await saveProfile(allianceName, nickname);
    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Failed to save profile');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-discord-gray rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-semibold text-discord-text mb-2">
          Set Up Your Profile
        </h2>
        <p className="text-discord-text-muted text-sm mb-6">
          Choose how you want to be displayed to other users.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="allianceName"
              className="block mb-1.5 font-medium text-sm text-discord-text-secondary"
            >
              Alliance Name
            </label>
            <input
              type="text"
              id="allianceName"
              placeholder="e.g., ABC, XYZ"
              value={allianceName}
              onChange={(e) => setAllianceName(e.target.value)}
              className={inputClasses}
              maxLength={10}
              autoFocus
            />
            <p className="text-discord-text-muted text-xs mt-1">
              Your alliance tag (max 10 characters)
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="nickname"
              className="block mb-1.5 font-medium text-sm text-discord-text-secondary"
            >
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              placeholder="Your display name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClasses}
              maxLength={30}
            />
            <p className="text-discord-text-muted text-xs mt-1">
              How you want to be called (max 30 characters)
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <div className="text-discord-text-muted text-sm mb-4">
            You will appear as: <span className="text-discord-text font-medium">
              [{allianceName || 'ABC'}] {nickname || 'YourName'}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2.5 border-none rounded text-sm font-medium cursor-pointer transition-all duration-200 bg-discord-blurple text-white hover:bg-discord-blurple-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
