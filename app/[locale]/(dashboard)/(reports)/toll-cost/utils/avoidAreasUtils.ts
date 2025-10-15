// --- Helper: Convert shape to avoid area string ---
export function shapeToAvoidArea(shape: { type: string; coordinates: any }): string | null {
  if (shape.type === 'rectangle') {
    // coordinates: H.geo.Rect
    const bbox = shape.coordinates;
    // bbox: {getTop, getLeft, getBottom, getRight}
    const north = bbox.getTop ? bbox.getTop() : bbox.north;
    const south = bbox.getBottom ? bbox.getBottom() : bbox.south;
    const west = bbox.getLeft ? bbox.getLeft() : bbox.west;
    const east = bbox.getRight ? bbox.getRight() : bbox.east;
    // Format: bbox:west,south,east,north
    const avoidArea = `bbox:${west},${south},${east},${north}`;
    return avoidArea;
  }
  if (shape.type === 'circle') {
    // coordinates: { center: {lat, lng}, radius }
    // Convert circle to bbox for avoid[areas] (API does not support circle directly)
    const { center, radius } = shape.coordinates;
    // Approximate: 1 deg lat ~ 111km, 1 deg lng ~ 111km * cos(lat)
    const dLat = (radius / 1000) / 111;
    const dLng = (radius / 1000) / (111 * Math.cos(center.lat * Math.PI / 180));
    const north = center.lat + dLat;
    const south = center.lat - dLat;
    const west = center.lng - dLng;
    const east = center.lng + dLng;
    // Format: bbox:west,south,east,north
    const avoidArea = `bbox:${west},${south},${east},${north}`;
    return avoidArea;
  }
  if (shape.type === 'polyline') {
    // coordinates: H.geo.LineString
    const coords: {lat: number, lng: number}[] = [];
    if (typeof shape.coordinates.getLatLngAltArray === 'function') {
      const arr = shape.coordinates.getLatLngAltArray();
      for (let i = 0; i < arr.length; i += 3) { // Skip altitude (every 3rd value)
        const lat = arr[i];
        const lng = arr[i + 1];
        // Validate coordinates
        if (typeof lat === 'number' && typeof lng === 'number' && 
            !isNaN(lat) && !isNaN(lng) && 
            lat !== 0 && lng !== 0 && 
            lat !== undefined && lng !== undefined) {
          coords.push({ lat, lng });
        }
      }
    }
    if (coords.length < 2) {
      console.warn('Polyline has less than 2 valid coordinates:', coords);
      return null;
    }
    // Format: polygon:lat1,lng1;lat2,lng2;lat3,lng3...
    const str = coords.map(pt => `${pt.lat},${pt.lng}`).join(';');
    const avoidArea = `polygon:${str}`;
    return avoidArea;
  }
  if (shape.type === 'polygon') {
    // coordinates: H.geo.Polygon
    const coords: {lat: number, lng: number}[] = [];
    if (typeof shape.coordinates.getExterior === 'function') {
      const exterior = shape.coordinates.getExterior();
      if (typeof exterior.getLatLngAltArray === 'function') {
        const arr = exterior.getLatLngAltArray();
        for (let i = 0; i < arr.length; i += 3) { // Skip altitude (every 3rd value)
          const lat = arr[i];
          const lng = arr[i + 1];
          // Validate coordinates
          if (typeof lat === 'number' && typeof lng === 'number' && 
              !isNaN(lat) && !isNaN(lng) && 
              lat !== 0 && lng !== 0 && 
              lat !== undefined && lng !== undefined) {
            coords.push({ lat, lng });
          }
        }
      }
    }
    if (coords.length < 3) {
      console.warn('Polygon has less than 3 valid coordinates:', coords);
      return null;
    }
    // Format: polygon:lat1,lng1;lat2,lng2;lat3,lng3...
    const str = coords.map(pt => `${pt.lat},${pt.lng}`).join(';');
    const avoidArea = `polygon:${str}`;
    return avoidArea;
  }
  return null;
}

// --- Helper: Update avoid areas and trigger re-routing ---
export function updateAvoidAreasForRerouting(
  drawnShapesRef: React.MutableRefObject<any[]>,
  setAvoidAreas: (areas: string[]) => void,
  onAvoidAreasChange?: (areas: string[]) => void
) {
  
  // Recalculate avoid areas based on current shape positions
  const shapes = drawnShapesRef.current.map(obj => {
    if (obj instanceof window.H.map.Rect) {
      return { type: 'rectangle', coordinates: obj.getBoundingBox() };
    } else if (obj instanceof window.H.map.Circle) {
      return { type: 'circle', coordinates: { center: obj.getCenter(), radius: obj.getRadius() } };
    } else if (obj instanceof window.H.map.Polyline) {
      return { type: 'polyline', coordinates: obj.getGeometry() };
    } else if (obj instanceof window.H.map.Group) {
      // For polygon groups, get the polygon from the group
      const polygon = obj.getObjects().find((o: any) => o instanceof window.H.map.Polygon);
      if (polygon) {
        return { type: 'polygon', coordinates: polygon.getGeometry() };
      }
    }
    return null;
  }).filter(Boolean);
  // Convert to avoid area strings
  const avoidStrs = shapes.map(shapeToAvoidArea).filter(Boolean) as string[];
  
  // Update avoid areas state
  setAvoidAreas(avoidStrs);
  
  // Trigger parent callback for avoid areas change (hanya sekali saat drag selesai)
  if (onAvoidAreasChange) {
    onAvoidAreasChange(avoidStrs);
  }
  
  // Expose to global window for external access
  if (typeof window !== 'undefined') {
    (window as any).__HERE_AVOID_AREAS = avoidStrs;
  }
} 