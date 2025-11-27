import { useState } from 'react';
import { useAlliance } from '../../contexts/AllianceContext';

export function AllianceModal() {
  const { showAllianceModal, setShowAllianceModal, joinAlliance, alliance } = useAlliance();
  const [allianceName, setAllianceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Don't show if user already has an alliance or modal is hidden
  if (!showAllianceModal || alliance) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allianceName.trim()) {
      setError('Please enter an alliance name');
      return;
    }

    setLoading(true);
    const result = await joinAlliance(allianceName);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to join alliance');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-gray rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-discord-text mb-4">Join an Alliance</h2>

        <p className="text-discord-text-secondary text-sm mb-4">
          Enter your alliance name to join. If the alliance doesn't exist, it will be created
          and assigned a unique color. <strong>This cannot be changed later.</strong>
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
              value={allianceName}
              onChange={(e) => setAllianceName(e.target.value)}
              placeholder="Enter alliance name..."
              className="w-full px-3 py-2 border border-discord-lighter-gray rounded text-sm bg-discord-dark text-discord-text transition-colors duration-200 focus:outline-none focus:border-discord-blurple focus:ring-2 focus:ring-discord-blurple/20"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 border-none rounded text-sm font-medium cursor-pointer transition-all duration-200 bg-discord-blurple text-white hover:-translate-y-0.5 hover:shadow-lg hover:bg-discord-blurple-hover active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Joining...' : 'Join Alliance'}
            </button>
            <button
              type="button"
              onClick={() => setShowAllianceModal(false)}
              className="px-4 py-2.5 border-none rounded text-sm font-medium cursor-pointer transition-all duration-200 bg-discord-lightest-gray text-discord-text hover:-translate-y-0.5 hover:shadow-lg hover:bg-discord-text-muted active:translate-y-0"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-discord-text-muted text-center">
          Alliance names are case-insensitive. "ABC" and "abc" are the same alliance.
        </p>
      </div>
    </div>
  );
}
