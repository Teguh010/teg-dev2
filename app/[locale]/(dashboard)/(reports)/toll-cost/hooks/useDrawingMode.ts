import { useEffect, useRef } from 'react';

interface UseDrawingModeProps {
  map: any;
  drawingMode: string | null;
  setDrawingMode: (mode: string | null) => void;
  onGeoshapesChange?: (shapes: Array<{ type: string; coordinates: any }>) => void;
  updateAvoidAreasForRerouting: () => void;
}

export const useDrawingMode = ({
  map,
  drawingMode,
  setDrawingMode,
  onGeoshapesChange,
  updateAvoidAreasForRerouting
}: UseDrawingModeProps) => {
  const drawnShapesRef = useRef<any[]>([]);
  const drawingShapeRef = useRef<any>(null);
  const drawingPointsRef = useRef<any[]>([]);
  const drawingListenerRef = useRef<any>(null);
  const pointerListenersRef = useRef<(() => void)[]>([]);

  // Function to safely remove all objects including nested groups
  const safeRemoveObject = (obj: any) => {
    if (!obj || !map) return;
    
    try {
      // If it's a group, remove all its children first
      if (obj instanceof window.H.map.Group) {
        const objects = obj.getObjects();
        objects.forEach((child: any) => {
          safeRemoveObject(child);
        });
      }
      
      // Remove from map if it exists
      if (map.getObjects().indexOf(obj) !== -1) {
        map.removeObject(obj);
      }
    } catch (error) {
      console.warn('Error removing map object:', error);
    }
  };

  // Clear all drawn shapes function
  const clearAllShapes = () => {
    drawnShapesRef.current.forEach((obj) => {
      safeRemoveObject(obj);
    });
    drawnShapesRef.current = [];
    if (onGeoshapesChange) onGeoshapesChange([]);
    updateAvoidAreasForRerouting();
  };

  useEffect(() => {
    if (!map || !window.H) return;
    
    // Cleanup previous listeners
    if (drawingListenerRef.current) {
      map.removeEventListener('tap', drawingListenerRef.current);
      drawingListenerRef.current = null;
    }
    pointerListenersRef.current.forEach(removeListener => removeListener());
    pointerListenersRef.current = [];
    
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const viewport = map.getViewPort().element as HTMLElement;

    // --- Rectangle ---
    if (drawingMode === 'rectangle') {
      const handlePointerDown = (evt: PointerEvent) => {
        if (evt.button !== 0) return;
        const rect = viewport.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        const dragStart = map.screenToGeo(x, y);
        let tempRect = new window.H.map.Rect(
          new window.H.geo.Rect(dragStart.lat, dragStart.lng, dragStart.lat, dragStart.lng),
          { style: { fillColor: 'rgba(0,128,255,0.2)', strokeColor: 'blue', lineWidth: 3 }, volatility: true }
        );
        map.addObject(tempRect);
        
        const handlePointerMove = (moveEvt: PointerEvent) => {
          const rect = viewport.getBoundingClientRect();
          const x = moveEvt.clientX - rect.left;
          const y = moveEvt.clientY - rect.top;
          const dragEnd = map.screenToGeo(x, y);
          tempRect.setBoundingBox(new window.H.geo.Rect(
            Math.min(dragStart.lat, dragEnd.lat),
            Math.min(dragStart.lng, dragEnd.lng),
            Math.max(dragStart.lat, dragEnd.lat),
            Math.max(dragStart.lng, dragEnd.lng)
          ));
        };
        const handlePointerUp = (upEvt: PointerEvent) => {
          const rect = viewport.getBoundingClientRect();
          const x = upEvt.clientX - rect.left;
          const y = upEvt.clientY - rect.top;
          const dragEnd = map.screenToGeo(x, y);
          tempRect.setBoundingBox(new window.H.geo.Rect(
            Math.min(dragStart.lat, dragEnd.lat),
            Math.min(dragStart.lng, dragEnd.lng),
            Math.max(dragStart.lat, dragEnd.lat),
            Math.max(dragStart.lng, dragEnd.lng)
          ));
          tempRect.draggable = true;
          drawnShapesRef.current.push(tempRect);
          if (onGeoshapesChange) onGeoshapesChange(drawnShapesRef.current.map(obj => ({ type: 'rectangle', coordinates: obj.getBoundingBox() })));
          updateAvoidAreasForRerouting();
          setDrawingMode(null);
          viewport.removeEventListener('pointermove', handlePointerMove);
          viewport.removeEventListener('pointerup', handlePointerUp);
        };
        viewport.addEventListener('pointermove', handlePointerMove, { passive: false });
        viewport.addEventListener('pointerup', handlePointerUp, { passive: false });
      };
      viewport.addEventListener('pointerdown', handlePointerDown, { passive: false });
      pointerListenersRef.current.push(() => viewport.removeEventListener('pointerdown', handlePointerDown));
    }
    // --- Circle ---
    else if (drawingMode === 'circle') {
      const handlePointerDown = (evt: PointerEvent) => {
        if (evt.button !== 0) return;
        const rect = viewport.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        const dragStart = map.screenToGeo(x, y);
        let tempCircle = new window.H.map.Circle(dragStart, 0, { style: { fillColor: 'rgba(0,128,255,0.2)', strokeColor: 'blue', lineWidth: 3 }, volatility: true });
        map.addObject(tempCircle);
        
        const handlePointerMove = (moveEvt: PointerEvent) => {
          const rect = viewport.getBoundingClientRect();
          const x = moveEvt.clientX - rect.left;
          const y = moveEvt.clientY - rect.top;
          const dragEnd = map.screenToGeo(x, y);
          const radius = new window.H.geo.Point(dragStart.lat, dragStart.lng).distance(new window.H.geo.Point(dragEnd.lat, dragEnd.lng));
          tempCircle.setRadius(radius);
        };
        const handlePointerUp = (upEvt: PointerEvent) => {
          const rect = viewport.getBoundingClientRect();
          const x = upEvt.clientX - rect.left;
          const y = upEvt.clientY - rect.top;
          const dragEnd = map.screenToGeo(x, y);
          const radius = new window.H.geo.Point(dragStart.lat, dragStart.lng).distance(new window.H.geo.Point(dragEnd.lat, dragEnd.lng));
          tempCircle.setRadius(radius);
          tempCircle.draggable = true;
          drawnShapesRef.current.push(tempCircle);
          if (onGeoshapesChange) onGeoshapesChange(drawnShapesRef.current.map(obj => ({ type: 'circle', coordinates: { center: obj.getCenter(), radius: obj.getRadius() } })));
          updateAvoidAreasForRerouting();
          setDrawingMode(null);
          viewport.removeEventListener('pointermove', handlePointerMove);
          viewport.removeEventListener('pointerup', handlePointerUp);
        };
        viewport.addEventListener('pointermove', handlePointerMove, { passive: false });
        viewport.addEventListener('pointerup', handlePointerUp, { passive: false });
      };
      viewport.addEventListener('pointerdown', handlePointerDown, { passive: false });
      pointerListenersRef.current.push(() => viewport.removeEventListener('pointerdown', handlePointerDown));
    }
    // --- Polygon (click-to-add, pointermove preview) ---
    else if (drawingMode === 'polygon') {
      let isDrawing = false;
      let tempPolygon: any = null;
      let firstPointMarker: any = null;
      let polygonPoints: { lat: number; lng: number }[] = [];
      let pointMarkers: any[] = []; // Track all point markers
      let lastTapTime = 0;
      const doubleTapDelay = 300; // milliseconds
      
      const svgCircle = '<svg width="20" height="20" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7" fill="transparent" stroke="red" stroke-width="4"/></svg>';
      const svgBigCircle = '<svg width="32" height="32" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13" fill="#fff" stroke="#2563eb" stroke-width="5"/></svg>';
      const svgPoint = '<svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" fill="#2563eb" stroke="#fff" stroke-width="2"/></svg>';
      
      const handleMapTap = (evt: any) => {
        const currentTime = Date.now();
        
        // Prevent double tap issues on mobile
        if (currentTime - lastTapTime < 100) {
          return;
        }
        lastTapTime = currentTime;
        
        evt.stopPropagation();
        const coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
        
        addPolygonPoint(coord);
      };
      
      const addPolygonPoint = (coord: any) => {
        polygonPoints.push(coord);
        
        // Add a visual marker for each point with better mobile stability
        const pointMarker = new window.H.map.Marker(coord, { 
          icon: new window.H.map.Icon(svgPoint, { anchor: { x: 8, y: 8 } }),
          zIndex: 999 // Ensure point markers stay on top
        });
        
        // Add the marker with a slight delay to ensure it's rendered properly on mobile
        if (isMobile) {
          setTimeout(() => {
            if (map && map.getObjects) {
              map.addObject(pointMarker);
            }
          }, 10);
        } else {
          map.addObject(pointMarker);
        }
        pointMarkers.push(pointMarker);
        
        if (!isDrawing) {
          isDrawing = true;
          const lineString = new window.H.geo.LineString();
          lineString.pushPoint(coord);
          lineString.pushPoint(coord);
          tempPolygon = new window.H.map.Polyline(lineString, { style: { strokeColor: 'blue', lineWidth: 3 }, volatility: true });
          map.addObject(tempPolygon);
          
          firstPointMarker = new window.H.map.Marker(coord, { 
            icon: new window.H.map.Icon(svgBigCircle, { anchor: { x: 16, y: 16 } }),
            zIndex: 1000 // Keep first point marker on top
          });
          
          // Add first point marker with proper mobile handling
          if (isMobile) {
            setTimeout(() => {
              if (map && map.getObjects) {
                map.addObject(firstPointMarker);
              }
            }, 20);
          } else {
            map.addObject(firstPointMarker);
          }
          
          // Use consistent tap events for both mobile and desktop
          firstPointMarker.addEventListener('tap', (ev: any) => {
            if (polygonPoints.length >= 3) {
              ev.stopPropagation(); 
              finishPolygon();
            }
          });
        } else {
          const lineString = new window.H.geo.LineString();
          polygonPoints.forEach(pt => lineString.pushPoint(pt));
          if (tempPolygon) {
            tempPolygon.setGeometry(lineString);
          }
        }
      };
      
      const handlePointerMove = (evt: PointerEvent) => {
        if (!isDrawing || !tempPolygon || polygonPoints.length === 0) return;
        const rect = viewport.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        const moveCoord = map.screenToGeo(x, y);
        
        const lineString = new window.H.geo.LineString();
        polygonPoints.forEach(pt => lineString.pushPoint(pt));
        lineString.pushPoint(moveCoord);
        
        if (lineString.getPointCount() >= 2) {
          tempPolygon.setGeometry(lineString);
        }
      };
      
      const finishPolygon = () => {
        if (!isDrawing || polygonPoints.length < 3) return;
        
        // Safety check before removing - ensure objects exist and are on the map
        if (tempPolygon && map.getObjects().indexOf(tempPolygon) !== -1) {
          map.removeObject(tempPolygon);
        }
        if (firstPointMarker && map.getObjects().indexOf(firstPointMarker) !== -1) {
          map.removeObject(firstPointMarker);
        }
        
        // Remove all point markers
        pointMarkers.forEach(marker => {
          if (marker && map.getObjects().indexOf(marker) !== -1) {
            map.removeObject(marker);
          }
        });
        
        const lineString = new window.H.geo.LineString();
        polygonPoints.forEach(pt => lineString.pushPoint(pt));
        const polygon = new window.H.map.Polygon(lineString, { style: { fillColor: 'rgba(0,128,255,0.2)', strokeColor: 'blue', lineWidth: 0 }, volatility: true });
        polygon.draggable = true;
        
        const verticeGroup = new window.H.map.Group({ visibility: false });
        const exterior = polygon.getGeometry().getExterior();
        exterior.eachLatLngAlt((lat: number, lng: number, alt: number, index: number) => {
          const vertice = new window.H.map.Marker(
            { lat, lng },
            { icon: new window.H.map.Icon(svgCircle, { anchor: { x: 10, y: 10 } }) }
          );
          vertice.draggable = true;
          vertice.setData({ verticeIndex: index });
          verticeGroup.addObject(vertice);
        });
        
        const polygonGroup = new window.H.map.Group({ volatility: true, objects: [polygon, verticeGroup] });
        map.addObject(polygonGroup);
        drawnShapesRef.current.push(polygonGroup);
        
        polygon.setData({ verticeGroup: verticeGroup });

        // Add debouncing to prevent multiple rapid clicks
        let lastToggleTime = 0;
        const toggleDelay = 300; // milliseconds
        
        if (isMobile) {
          polygonGroup.addEventListener('tap', function (evt: any) {
            const currentTime = Date.now();
            if (currentTime - lastToggleTime < toggleDelay) {
              return; // Ignore rapid clicks
            }
            lastToggleTime = currentTime;
            
            evt.stopPropagation();
            verticeGroup.setVisibility(!verticeGroup.getVisibility());
          }, true);
          
          polygon.addEventListener('dragstart', function () {
            verticeGroup.setVisibility(true);
          });
          polygon.addEventListener('dragend', function () {
            setTimeout(() => verticeGroup.setVisibility(false), 2000);
          });
        } else {
          let polygonTimeout: ReturnType<typeof setTimeout> | null = null;
          polygonGroup.addEventListener('pointerenter', () => {
            if (polygonTimeout) clearTimeout(polygonTimeout);
            verticeGroup.setVisibility(true);
          }, true);
          polygonGroup.addEventListener('pointerleave', () => {
            polygonTimeout = setTimeout(() => verticeGroup.setVisibility(false), 0);
          }, true);
        }
        
        verticeGroup.addEventListener('drag', function (evt: any) {
          const pointer = evt.currentPointer;
          const geoLineString = polygon.getGeometry().getExterior();
          const geoPoint = map.screenToGeo(pointer.viewportX, pointer.viewportY);
          evt.target.setGeometry(geoPoint);
          geoLineString.removePoint(evt.target.getData()["verticeIndex"]);
          geoLineString.insertPoint(evt.target.getData()["verticeIndex"], geoPoint);
          polygon.setGeometry(new window.H.geo.Polygon(geoLineString));
          
          if (onGeoshapesChange) onGeoshapesChange(drawnShapesRef.current.map(obj => {
              if (obj instanceof window.H.map.Group) {
                const poly = obj.getObjects().find((o: any) => o instanceof window.H.map.Polygon);
                if (poly) return { type: 'polygon', coordinates: poly.getGeometry() };
              }
              return { type: 'unknown', coordinates: null };
            }));
          evt.stopPropagation();
        }, true);
        
        verticeGroup.addEventListener('dragend', updateAvoidAreasForRerouting, true);
        
        if (onGeoshapesChange) onGeoshapesChange(drawnShapesRef.current.map(() => ({ type: 'polygon', coordinates: polygon.getGeometry() })));
        updateAvoidAreasForRerouting();
        
        // Reset state
        polygonPoints = [];
        pointMarkers = [];
        tempPolygon = null;
        isDrawing = false;
        setDrawingMode(null);
        
        // Remove listeners
        map.removeEventListener('tap', handleMapTap);
        viewport.removeEventListener('pointermove', handlePointerMove);
        map.removeEventListener('dbltap', handleDoubleClick);
      };
      
      const handleDoubleClick = () => finishPolygon();
      
      // Simplified event handling - same for mobile and desktop
      map.addEventListener('tap', handleMapTap);
      viewport.addEventListener('pointermove', handlePointerMove);
      map.addEventListener('dbltap', handleDoubleClick);
      
      drawingListenerRef.current = handleMapTap;
      
      return () => {
        map.removeEventListener('tap', handleMapTap);
        viewport.removeEventListener('pointermove', handlePointerMove);
        map.removeEventListener('dbltap', handleDoubleClick);
        // Safety checks before removing - ensure objects exist and are on the map
        if (firstPointMarker && map.getObjects().indexOf(firstPointMarker) !== -1) {
          map.removeObject(firstPointMarker);
        }
        if (tempPolygon && map.getObjects().indexOf(tempPolygon) !== -1) {
          map.removeObject(tempPolygon);
        }
        // Clean up point markers
        pointMarkers.forEach(marker => {
          if (marker && map.getObjects().indexOf(marker) !== -1) {
            map.removeObject(marker);
          }
        });
        polygonPoints = [];
        pointMarkers = [];
        isDrawing = false;
      };
    }
    // --- Polyline ---
    else if (drawingMode === 'polyline') {
      const handleDrawTap = (evt: any) => {
        const coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
        drawingPointsRef.current.push(coord);
        if (drawingShapeRef.current) map.removeObject(drawingShapeRef.current);
        const lineString = new window.H.geo.LineString();
        drawingPointsRef.current.forEach((pt: any) => lineString.pushPoint(pt));
        const shapeObj = new window.H.map.Polyline(lineString, { style: { strokeColor: 'blue', lineWidth: 3 }, volatility: true });
        map.addObject(shapeObj);
        drawingShapeRef.current = shapeObj;
      };
      const handleDoubleTap = () => {
        if (drawingPointsRef.current.length > 1) {
          if (drawingShapeRef.current) map.removeObject(drawingShapeRef.current);
          const lineString = new window.H.geo.LineString();
          drawingPointsRef.current.forEach((pt: any) => lineString.pushPoint(pt));
          const shapeObj = new window.H.map.Polyline(lineString, { style: { strokeColor: 'blue', lineWidth: 3 }, volatility: true });
          map.addObject(shapeObj);
          drawnShapesRef.current.push(shapeObj);
          if (onGeoshapesChange) onGeoshapesChange(drawnShapesRef.current.map(obj => ({ type: 'polyline', coordinates: obj.getGeometry ? obj.getGeometry() : null })));
          updateAvoidAreasForRerouting();
          drawingPointsRef.current = [];
          setDrawingMode(null);
        }
      };
      map.addEventListener('tap', handleDrawTap);
      map.addEventListener('dbltap', handleDoubleTap);
      drawingListenerRef.current = handleDrawTap;
      return () => {
        map.removeEventListener('tap', handleDrawTap);
        map.removeEventListener('dbltap', handleDoubleTap);
      };
    }
    else if (!drawingMode) {
      drawingPointsRef.current = [];
      if (drawingShapeRef.current) {
        map.removeObject(drawingShapeRef.current);
        drawingShapeRef.current = null;
      }
    }
  }, [drawingMode, onGeoshapesChange, updateAvoidAreasForRerouting, setDrawingMode, map]);

  return {
    drawnShapesRef,
    drawingShapeRef,
    drawingPointsRef,
    drawingListenerRef,
    clearAllShapes
  };
};