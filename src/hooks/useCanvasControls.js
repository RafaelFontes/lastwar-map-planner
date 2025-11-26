import { useState, useCallback, useRef, useEffect } from 'react';

export function useCanvasControls(tileGeometry) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerPosition = useRef(null);
  const containerRef = useRef(null);
  const stageRef = useRef(null);

  // Fit map to screen
  const fitToScreen = useCallback(() => {
    if (!tileGeometry || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const mapWidth = tileGeometry.width;
    const mapHeight = tileGeometry.height;

    const scaleX = containerWidth / mapWidth;
    const scaleY = containerHeight / mapHeight;
    const newScale = Math.min(scaleX, scaleY) * 0.95;

    setScale(newScale);

    const scaledWidth = mapWidth * newScale;
    const scaledHeight = mapHeight * newScale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;
    setPosition({ x: offsetX, y: offsetY });
  }, [tileGeometry]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (tileGeometry) {
        fitToScreen();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tileGeometry, fitToScreen]);

  // Initial fit when geometry loads
  useEffect(() => {
    if (tileGeometry) {
      fitToScreen();
    }
  }, [tileGeometry, fitToScreen]);

  // Zoom controls
  const zoom = useCallback((direction) => {
    const scaleBy = 1.1;
    let newScale;

    if (direction === 'in') {
      newScale = scale * scaleBy;
    } else if (direction === 'out') {
      newScale = scale / scaleBy;
    } else {
      fitToScreen();
      return;
    }

    // Limit zoom
    if (newScale < 0.5 || newScale > 3) return;

    // Zoom to center
    if (containerRef.current) {
      const container = containerRef.current;
      const center = {
        x: container.clientWidth / 2,
        y: container.clientHeight / 2
      };

      const mousePointTo = {
        x: (center.x - position.x) / scale,
        y: (center.y - position.y) / scale,
      };

      const newPos = {
        x: center.x - mousePointTo.x * newScale,
        y: center.y - mousePointTo.y * newScale,
      };

      setScale(newScale);
      setPosition(newPos);
    } else {
      setScale(newScale);
    }
  }, [scale, position, fitToScreen]);

  // Pan handlers
  const handlePanStart = useCallback((clientX, clientY) => {
    setIsPanning(true);
    lastPointerPosition.current = { x: clientX, y: clientY };
  }, []);

  const handlePanMove = useCallback((clientX, clientY) => {
    if (!isPanning || !lastPointerPosition.current) return;

    const dx = clientX - lastPointerPosition.current.x;
    const dy = clientY - lastPointerPosition.current.y;

    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));

    lastPointerPosition.current = { x: clientX, y: clientY };
  }, [isPanning]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    lastPointerPosition.current = null;
  }, []);

  return {
    scale,
    position,
    isPanning,
    containerRef,
    stageRef,
    zoom,
    fitToScreen,
    handlePanStart,
    handlePanMove,
    handlePanEnd
  };
}
