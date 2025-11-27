import { useMemo } from 'react';

export function TileList({ labeledTiles, tileClaims, filter, onFilterChange, onTileClick }) {
  // Filter to only show claimed tiles and sort by alliance name, then by level number
  const claimedTiles = useMemo(() => {
    // Only include tiles that have an alliance claim
    const tilesWithClaims = labeledTiles
      .map(tile => ({
        ...tile,
        claim: tileClaims?.get(tile.id)
      }))
      .filter(tile => tile.claim?.allianceName);

    // Sort by alliance name first, then by number
    return tilesWithClaims.sort((a, b) => {
      // First sort by alliance name
      const allianceCompare = (a.claim.allianceName || '').localeCompare(b.claim.allianceName || '');
      if (allianceCompare !== 0) return allianceCompare;

      // Then sort by number (as numbers, not strings)
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
  }, [labeledTiles, tileClaims]);

  // Apply text filter
  const filteredTiles = useMemo(() => {
    if (!filter) return claimedTiles;
    const lowerFilter = filter.toLowerCase();
    return claimedTiles.filter(tile =>
      (tile.number && tile.number.toString().includes(lowerFilter)) ||
      (tile.claim?.allianceName && tile.claim.allianceName.toLowerCase().includes(lowerFilter))
    );
  }, [claimedTiles, filter]);

  return (
    <div className="w-[400px] max-lg:w-[320px] max-md:hidden bg-discord-gray border-l border-discord-lighter-gray p-4 pt-5 shrink-0 flex flex-col overflow-hidden">
      <div className="flex flex-col gap-3 mb-4">
        <h2 className="m-0 text-base font-semibold text-discord-text">Claimed Tiles</h2>
        <div>
          <input
            type="text"
            placeholder="Filter by level or alliance..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-2 border border-discord-lighter-gray rounded text-sm w-full bg-discord-dark text-discord-text placeholder-discord-text-muted transition-colors duration-200 focus:outline-none focus:border-discord-blurple focus:ring-2 focus:ring-discord-blurple/20"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto border border-discord-lighter-gray rounded">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-discord-not-quite-black sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-discord-text-secondary border-b-2 border-discord-lighter-gray">Alliance</th>
              <th className="px-4 py-3 text-left font-semibold text-discord-text-secondary border-b-2 border-discord-lighter-gray">Level</th>
            </tr>
          </thead>
          <tbody>
            {filteredTiles.length === 0 ? (
              <tr>
                <td colSpan="2" className="text-center text-discord-text-muted italic py-5 px-4">
                  {filter ? 'No matching tiles' : 'No claimed tiles yet'}
                </td>
              </tr>
            ) : (
              filteredTiles.map((tile) => (
                <tr
                  key={tile.id}
                  onClick={() => onTileClick(tile)}
                  className="hover:bg-discord-lighter-gray cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3 border-b border-discord-lighter-gray text-discord-text">
                    <div className="flex items-center gap-2">
                      {tile.claim?.color && (
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: tile.claim.color }}
                        />
                      )}
                      {tile.claim?.allianceName}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-discord-lighter-gray text-discord-text">
                    {tile.number !== '' ? `L${tile.number}` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
