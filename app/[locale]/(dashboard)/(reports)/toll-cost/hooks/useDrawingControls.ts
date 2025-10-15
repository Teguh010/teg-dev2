import { useEffect } from 'react';

interface UseDrawingControlsProps {
  mapRef: React.RefObject<HTMLDivElement>;
  drawingMode: string | null;
  setDrawingMode: (mode: string | null) => void;
  onGeoshapesChange?: (shapes: Array<{ type: string; coordinates: any }>) => void;
  updateAvoidAreasForRerouting: () => void;
  drawnShapesRef: React.MutableRefObject<any[]>; // Tambahkan ini agar konsisten
  clearAllShapes?: () => void; // Add clearAllShapes function
}

export const useDrawingControls = ({
  mapRef,
  drawingMode,
  setDrawingMode,
  onGeoshapesChange,
  updateAvoidAreasForRerouting,
  drawnShapesRef,
  clearAllShapes,
}: UseDrawingControlsProps) => {
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    
    // Detect if device is mobile/touch
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    let controlsDiv = document.getElementById('here-geoshape-controls');
    if (!controlsDiv) {
      controlsDiv = document.createElement('div');
      controlsDiv.id = 'here-geoshape-controls';
      controlsDiv.style.position = 'absolute';
      controlsDiv.style.bottom = '190px'; // di atas zoom control
      controlsDiv.style.right = '22px';
      controlsDiv.style.zIndex = '1000';
      controlsDiv.style.background = 'rgba(255,255,255,0.95)';
      controlsDiv.style.borderRadius = '12px';
      controlsDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      controlsDiv.style.padding = '8px 6px';
      controlsDiv.style.display = 'flex';
      controlsDiv.style.flexDirection = 'column';
      controlsDiv.style.gap = '8px';
      
      controlsDiv.innerHTML = `
           <button id="draw-polygon" type="button" aria-label="Draw Polygon" style="background:none;border:none;padding:0;cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:8px;">
  <span class="iconify" data-icon="mdi:vector-polygon" data-width="28" data-height="28"></span>
</button>
        <button id="draw-rectangle" type="button" aria-label="Draw Rectangle" style="background:none;border:none;padding:0;cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:8px;">
          <span class="iconify" data-icon="mdi:rectangle-outline" data-width="28" data-height="28"></span>
        </button>
        <button id="draw-circle" type="button" aria-label="Draw Circle" style="background:none;border:none;padding:0;cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:8px;">
          <span class="iconify" data-icon="mdi:circle-outline" data-width="28" data-height="28"></span>
        </button>
        <button id="clear-shapes" type="button" aria-label="Clear Shapes" style="background:none;border:none;padding:0;cursor:pointer;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:8px;">
          <span class="iconify" data-icon="mdi:close-circle-outline" data-width="28" data-height="28"></span>
        </button>
      `;
      mapRef.current.appendChild(controlsDiv);
      // Inject Iconify script if not present
      if (!document.getElementById('iconify-script')) {
        const iconifyScript = document.createElement('script');
        iconifyScript.id = 'iconify-script';
        iconifyScript.src = 'https://code.iconify.design/3/3.1.1/iconify.min.js';
        iconifyScript.async = true;
        document.body.appendChild(iconifyScript);
      }
    }
    // --- Button active toggle logic ---
    const setActiveButton = (mode: string | null) => {
      const ids = ['draw-polygon', 'draw-rectangle', 'draw-circle'];
      ids.forEach(id => {
        const btn = document.getElementById(id) as HTMLButtonElement | null;
        if (!btn) return;
        if (mode && id === `draw-${mode}`) {
          btn.classList.add('here-draw-active');
          btn.style.background = '#d1d5db'; // abu-abu sedikit lebih gelap untuk aktif
          btn.style.color = '#111827'; // lebih gelap saat aktif
          btn.style.boxShadow = '0 2px 8px rgba(37,99,235,0.10)';
        } else {
          btn.classList.remove('here-draw-active');
          btn.style.background = ''; // abu-abu terang untuk default
          btn.style.color = '#374151'; // abu-abu gelap untuk default
          btn.style.boxShadow = '';
        }
      });
    };
    setActiveButton(drawingMode);
    // --- Fix: Use stable function references for cleanup ---
    const setModePolygon = () => { setDrawingMode('polygon'); };
    const setModeRectangle = () => { setDrawingMode('rectangle'); };
    const setModeCircle = () => { setDrawingMode('circle'); };
    const clearShapes = () => {
      setDrawingMode(null);
      
      // Use the proper clearAllShapes function if available
      if (clearAllShapes) {
        clearAllShapes();
        return;
      }
      
      // Fallback to old method if clearAllShapes not available
      if (drawnShapesRef.current.length > 0) {
        // Try to access map instance from various ways
        let mapInstance = null;
        
        // Method 1: from window global
        if (typeof window !== 'undefined' && (window as any).__HERE_MAP_INSTANCE) {
          mapInstance = (window as any).__HERE_MAP_INSTANCE;
        }
        // Method 2: from HERE Map instances
        else if (window.H && window.H.Map && window.H.Map.instances && window.H.Map.instances.length > 0) {
          mapInstance = window.H.Map.instances[0];
        }
        // Method 3: search in DOM
        else {
          const mapContainer = mapRef.current;
          if (mapContainer) {
            // Find map instance from parent container
            const mapElement = mapContainer.querySelector('[data-here-map]');
            if (mapElement && (mapElement as any).__HERE_MAP_INSTANCE) {
              mapInstance = (mapElement as any).__HERE_MAP_INSTANCE;
            }
          }
        }
        
        if (mapInstance) {
          drawnShapesRef.current.forEach((obj) => {
            // Use safe removal for groups
            try {
              if (obj instanceof window.H.map.Group) {
                const objects = obj.getObjects();
                objects.forEach((child: any) => {
                  if (mapInstance.getObjects().indexOf(child) !== -1) {
                    mapInstance.removeObject(child);
                  }
                });
              }
              if (mapInstance.getObjects().indexOf(obj) !== -1) {
                mapInstance.removeObject(obj);
              }
            } catch (error) {
              console.warn('Error removing map object:', error);
            }
          });
        }
        drawnShapesRef.current = [];
        if (onGeoshapesChange) onGeoshapesChange([]);
        updateAvoidAreasForRerouting();
      }
    };
    document.getElementById('draw-polygon')?.addEventListener('click', setModePolygon);
    document.getElementById('draw-rectangle')?.addEventListener('click', setModeRectangle);
    document.getElementById('draw-circle')?.addEventListener('click', setModeCircle);
    document.getElementById('clear-shapes')?.addEventListener('click', clearShapes);
    
    // Add touch events for mobile devices
    if (isMobile) {
      document.getElementById('draw-polygon')?.addEventListener('touchend', setModePolygon);
      document.getElementById('draw-rectangle')?.addEventListener('touchend', setModeRectangle);
      document.getElementById('draw-circle')?.addEventListener('touchend', setModeCircle);
      document.getElementById('clear-shapes')?.addEventListener('touchend', clearShapes);
    }
    
    // --- Observe drawingMode changes for button active state ---
    const observer = new MutationObserver(() => setActiveButton(drawingMode));
    observer.observe(controlsDiv, { childList: true, subtree: true, attributes: true });
    return () => {
      document.getElementById('draw-polygon')?.removeEventListener('click', setModePolygon);
      document.getElementById('draw-rectangle')?.removeEventListener('click', setModeRectangle);
      document.getElementById('draw-circle')?.removeEventListener('click', setModeCircle);
      document.getElementById('clear-shapes')?.removeEventListener('click', clearShapes);
      
      // Remove touch events
      if (isMobile) {
        document.getElementById('draw-polygon')?.removeEventListener('touchend', setModePolygon);
        document.getElementById('draw-rectangle')?.removeEventListener('touchend', setModeRectangle);
        document.getElementById('draw-circle')?.removeEventListener('touchend', setModeCircle);
        document.getElementById('clear-shapes')?.removeEventListener('touchend', clearShapes);
      }
      
      observer.disconnect();
    };
  }, [drawingMode, onGeoshapesChange, drawnShapesRef, updateAvoidAreasForRerouting]);
}; 