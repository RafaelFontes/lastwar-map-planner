import { useCallback } from 'react';
import { Header } from './components/Header/Header';
import { MapCanvas } from './components/MapCanvas/MapCanvas';
import { TileList } from './components/TileList/TileList';
import { Sidebar } from './components/Sidebar/Sidebar';
import { useMapEditor } from './hooks/useMapEditor';
import { useCanvasControls } from './hooks/useCanvasControls';
import { useAuth } from './contexts/AuthContext';
import styles from './App.module.css';

function App() {
  const { user } = useAuth();
  const isReadOnly = !user;
  const {
    isLoading,
    tileGeometry,
    tiles,
    history,
    selectedTile,
    getTileData,
    setTileData,
    clearTileData,
    selectTile,
    moveLabelOffset,
    addComment,
    getComments,
    activeTab,
    setActiveTab,
    tileFilter,
    setTileFilter,
    getLabeledTiles
  } = useMapEditor();

  const {
    scale,
    position,
    isPanning,
    containerRef,
    stageRef,
    zoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd
  } = useCanvasControls(tileGeometry);

  // Handle tile click from map
  const handleTileClick = useCallback((tileInfo) => {
    selectTile(tileInfo);
  }, [selectTile]);

  // Handle tile click from list (need to find tile info)
  const handleTileListClick = useCallback((labeledTile) => {
    if (tileGeometry) {
      const tileInfo = tileGeometry.tiles.find(t => t.id === labeledTile.id);
      if (tileInfo) {
        selectTile(tileInfo);
      }
    }
  }, [tileGeometry, selectTile]);

  // Get current tile data and comments
  const currentTileData = selectedTile ? getTileData(selectedTile.id) : {};
  const currentComments = selectedTile ? getComments(selectedTile.id) : [];
  const labeledTiles = getLabeledTiles();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading map data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header scale={scale} onZoom={zoom} />

      <div className={styles.mainContent}>
        <MapCanvas
          tileGeometry={tileGeometry}
          tiles={tiles}
          selectedTile={selectedTile}
          onTileClick={handleTileClick}
          onLabelMove={moveLabelOffset}
          scale={scale}
          position={position}
          isPanning={isPanning}
          containerRef={containerRef}
          stageRef={stageRef}
          onPanStart={handlePanStart}
          onPanMove={handlePanMove}
          onPanEnd={handlePanEnd}
        />

        <TileList
          labeledTiles={labeledTiles}
          filter={tileFilter}
          onFilterChange={setTileFilter}
          onTileClick={handleTileListClick}
        />

        <Sidebar
          selectedTile={selectedTile}
          tileData={currentTileData}
          comments={currentComments}
          history={history}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSaveTile={setTileData}
          onClearTile={clearTileData}
          onAddComment={addComment}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  );
}

export default App;
