import { useEffect } from 'react';

interface UseShapeManagementProps {
  map: any;
  drawnShapesRef: React.MutableRefObject<any[]>;
  onGeoshapesChange?: (shapes: Array<{ type: string; coordinates: any }>) => void;
  updateAvoidAreasForRerouting: () => void;
}

export const useShapeManagement = ({
  map,
  drawnShapesRef,
  onGeoshapesChange,
  updateAvoidAreasForRerouting
}: UseShapeManagementProps) => {

  useEffect(() => {
    if (!map || !window.H) return;
    
    // Detect if device is mobile/touch
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Set all shapes as draggable and add proper event listeners
    drawnShapesRef.current.forEach((shape) => {
      if (shape instanceof window.H.map.Group) {
        // For polygon groups, polygon tidak dibuat draggable
        const polygon = shape.getObjects().find((o: any) => o instanceof window.H.map.Polygon);
        if (polygon) {
          // Polygon tidak draggable
        }
      } else {
        if (shape instanceof window.H.map.Circle) {
          shape.draggable = true;
          addCircleDragListeners(shape, map);
        } else if (shape instanceof window.H.map.Rect) {
          shape.draggable = true;
          addRectDragListeners(shape, map);
        } else if (shape instanceof window.H.map.Polyline) {
          shape.draggable = true;
          addPolylineDragListeners(shape, map);
        }
        // Polygon tidak dibuat draggable
      }
    });

    // --- Helper: Show/hide delete button on shape hover/click ---
    let currentDeleteButton: HTMLDivElement | null = null;
    let currentShapeForDelete: any = null;
    const isDeleting = false; // Flag to prevent multiple clicks

    const showDeleteButton = (shape: any) => {
      // Don't show if currently deleting
      if (isDeleting) return;
      
      // Remove existing delete button if any
      hideDeleteButton();
      
      currentShapeForDelete = shape;
      
      // Get shape center to position button in the middle
      let shapeCenter;
      if (shape instanceof window.H.map.Circle) {
        const center = shape.getCenter();
        shapeCenter = map.geoToScreen(center);
      } else if (shape instanceof window.H.map.Rect) {
        const bbox = shape.getBoundingBox();
        const centerLat = (bbox.getTop() + bbox.getBottom()) / 2;
        const centerLng = (bbox.getLeft() + bbox.getRight()) / 2;
        shapeCenter = map.geoToScreen({ lat: centerLat, lng: centerLng });
      } else if (shape instanceof window.H.map.Polyline) {
        const geometry = shape.getGeometry();
        const points = [];
        geometry.eachLatLngAlt((lat: number, lng: number) => {
          points.push({ lat, lng });
        });
        if (points.length > 0) {
          const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
          const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
          shapeCenter = map.geoToScreen({ lat: centerLat, lng: centerLng });
        }
      } else if (shape instanceof window.H.map.Group) {
        // For polygon groups, get the polygon center
        const polygon = shape.getObjects().find((o: any) => o instanceof window.H.map.Polygon);
        if (polygon) {
          const geometry = polygon.getGeometry();
          const exterior = geometry.getExterior();
          const points = [];
          exterior.eachLatLngAlt((lat: number, lng: number) => {
            points.push({ lat, lng });
          });
          if (points.length > 0) {
            const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
            const centerLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
            shapeCenter = map.geoToScreen({ lat: centerLat, lng: centerLng });
          }
        }
      }
      
      // Create delete button
      const deleteButton = document.createElement('div');
      deleteButton.className = 'here-delete-shape-btn';
      deleteButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#FF4444"/>
        </svg>
      `;
      deleteButton.style.cssText = `
        position: absolute;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #FF4444;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        pointer-events: auto;
      `;
      // Jika posisi terlalu dekat pojok kanan bawah, tambahkan offset
      if (shapeCenter) {
        let top = shapeCenter.y - 12;
        let left = shapeCenter.x - 12;
        // Buffer dari bawah dan kanan (misal: 40px)
        const minBottom = window.innerHeight - 40;
        const minRight = window.innerWidth - 40;
        if (top > minBottom) top = minBottom;
        if (left > minRight) left = minRight;
        deleteButton.style.top = `${top}px`;
        deleteButton.style.left = `${left}px`;
      } else {
        // Fallback position
        deleteButton.style.top = '8px';
        deleteButton.style.right = '8px';
      }
      
      // Add hover effects
      deleteButton.addEventListener('mouseenter', () => {
        deleteButton.style.transform = 'scale(1.1)';
      });
      
      deleteButton.addEventListener('mouseleave', () => {
        deleteButton.style.background = 'rgba(255, 255, 255, 0.9)';
        deleteButton.style.transform = 'scale(1)';
      });
      
      // Add click handler to delete shape
      const clickHandler = (e: Event) => {
        e.stopPropagation();
        // Hide the button (do not remove from DOM)
        if (deleteButton) {
          deleteButton.style.display = 'none';
          deleteButton.style.pointerEvents = 'none';
        }
        currentDeleteButton = null;
        currentShapeForDelete = null;
        deleteShape(shape);
      };
      deleteButton.addEventListener('click', clickHandler);

      // Position the button relative to the shape
      const mapContainer = map.getViewPort().element.parentElement;
      if (mapContainer) {
        mapContainer.appendChild(deleteButton);
        currentDeleteButton = deleteButton;
      }
    };

    const hideDeleteButton = () => {
      if (currentDeleteButton) {
        currentDeleteButton.style.display = 'none';
        currentDeleteButton.style.pointerEvents = 'none';
        currentDeleteButton = null;
        currentShapeForDelete = null;
      }
    };

    const deleteShape = (shape: any) => {
      // Remove all delete buttons (brute force, to prevent orphan)
      document.querySelectorAll('.here-delete-shape-btn').forEach(btn => btn.remove());
      currentDeleteButton = null;
      currentShapeForDelete = null;
      // Remove shape from map
      if (map) {
        map.removeObject(shape);
      }
      // Remove from drawnShapesRef
      const index = drawnShapesRef.current.indexOf(shape);
      if (index > -1) {
        drawnShapesRef.current.splice(index, 1);
      }
      // Update parent callback
      if (onGeoshapesChange) {
        onGeoshapesChange(drawnShapesRef.current.map(obj => {
          if (obj instanceof window.H.map.Group) {
            const poly = obj.getObjects().find((o: any) => o instanceof window.H.map.Polygon);
            if (poly) return { type: 'polygon', coordinates: poly.getGeometry() };
          } else if (obj instanceof window.H.map.Circle) {
            return { type: 'circle', coordinates: { center: obj.getCenter(), radius: obj.getRadius() } };
          } else if (obj instanceof window.H.map.Polyline) {
            return { type: 'polyline', coordinates: obj.getGeometry() };
          } else if (obj instanceof window.H.map.Rect) {
            return { type: 'rectangle', coordinates: obj.getBoundingBox() };
          }
          return { type: 'unknown', coordinates: null };
        }));
      }
      // Update avoid areas and trigger re-routing
      updateAvoidAreasForRerouting();
    };

    // Add cursor change listeners and hover delete buttons for draggable shapes
    drawnShapesRef.current.forEach((shape) => {
      if (shape.draggable) {
        // Only add cursor change for draggable shapes (circle, rect, polyline)
        shape.addEventListener('pointerenter', function () {
          document.body.style.cursor = 'pointer';
          // Show delete button on hover (desktop only)
          if (!isMobile) {
            showDeleteButton(shape);
          }
        }, true);
        shape.addEventListener('pointerleave', function () {
          document.body.style.cursor = 'default';
          // Hide delete button when not hovering (desktop only)
          if (!isMobile) {
            hideDeleteButton();
          }
        }, true);
        
        // For mobile: add tap/click listener to show delete button immediately
        if (isMobile) {
          shape.addEventListener('tap', function (evt: any) {
            evt.stopPropagation(); // Prevent map click events
            // Toggle delete button visibility
            if (currentShapeForDelete === shape && currentDeleteButton) {
              hideDeleteButton();
            } else {
              showDeleteButton(shape);
            }
          }, true);
        }
      }
      // Polygon tidak mendapat cursor change listener tapi tetap bisa dihapus
    });

    // Add hover delete button for polygon groups (non-draggable)
    drawnShapesRef.current.forEach((shape) => {
      if (shape instanceof window.H.map.Group) {
        // Polygon groups can also be deleted
        shape.addEventListener('pointerenter', function () {
          document.body.style.cursor = 'pointer';
          // Show delete button on hover (desktop only)
          if (!isMobile) {
            showDeleteButton(shape);
          }
        }, true);
        shape.addEventListener('pointerleave', function () {
          document.body.style.cursor = 'default';
          // Hide delete button when not hovering (desktop only)
          if (!isMobile) {
            hideDeleteButton();
          }
        }, true);
        
        // For mobile: add tap/click listener to show delete button immediately
        if (isMobile) {
          shape.addEventListener('tap', function (evt: any) {
            evt.stopPropagation(); // Prevent map click events
            // Toggle delete button visibility
            if (currentShapeForDelete === shape && currentDeleteButton) {
              hideDeleteButton();
            } else {
              showDeleteButton(shape);
            }
          }, true);
        }
      }
    });

    // Helper functions for drag listeners
    function addCircleDragListeners(circle: any, map: any) {
      circle.addEventListener('dragstart', function (evt: any) {
        const pointer = evt.currentPointer;
        const object = evt.target;
        const screenPosition = map.geoToScreen(object.getCenter());
        const offset = new window.H.math.Point(
          pointer.viewportX - screenPosition.x,
          pointer.viewportY - screenPosition.y
        );
        object.setData({ offset: offset });
        
        // Hide delete button during drag
        if (currentDeleteButton && currentShapeForDelete === object) {
          currentDeleteButton.style.display = 'none';
          currentDeleteButton.style.pointerEvents = 'none';
        }
        
        evt.stopPropagation();
      });

      circle.addEventListener('drag', function (evt: any) {
        const pointer = evt.currentPointer;
        const object = evt.target;
        const offset = object.getData()['offset'];
        object.setCenter(
          map.screenToGeo(
            pointer.viewportX - offset.x,
            pointer.viewportY - offset.y
          )
        );
        
        evt.stopPropagation();
      });

      circle.addEventListener('dragend', function () {
        // Don't show delete button again after drag - let user hover again to show it
        // This prevents the button from appearing after drag and being clickable
        
        // evt.stopPropagation();
      });
    }

    function addRectDragListeners(rect: any, map: any) {
      rect.addEventListener('dragstart', function (evt: any) {
        const pointer = evt.currentPointer;
        const object = evt.target;
        object.setData({
          startCoord: map.screenToGeo(pointer.viewportX, pointer.viewportY),
        });
        
        // Hide delete button during drag
        if (currentDeleteButton && currentShapeForDelete === object) {
          currentDeleteButton.style.display = 'none';
          currentDeleteButton.style.pointerEvents = 'none';
        }
        
        evt.stopPropagation();
      });

      rect.addEventListener('drag', function (evt: any) {
        const pointer = evt.currentPointer;
        const object = evt.target;
        const startCoord = object.getData()['startCoord'];
        const newCoord = map.screenToGeo(pointer.viewportX, pointer.viewportY);

        if (!newCoord.equals(startCoord)) {
          const currentGeoRect = object.getBoundingBox();
          const newTop = currentGeoRect.getTop() + newCoord.lat - startCoord.lat;
          const newLeft = currentGeoRect.getLeft() + newCoord.lng - startCoord.lng;
          const newBottom = currentGeoRect.getBottom() + newCoord.lat - startCoord.lat;
          const newRight = currentGeoRect.getRight() + newCoord.lng - startCoord.lng;
          const newGeoRect = new window.H.geo.Rect(newTop, newLeft, newBottom, newRight);

          // Prevent dragging to latitude over 90 or -90 degrees
          if (newTop >= 90 || newBottom <= -90) {
            return;
          }

          object.setBoundingBox(newGeoRect);
          object.setData({ startCoord: newCoord });
        }
        evt.stopPropagation();
      });

      rect.addEventListener('dragend', function () {
        // Don't show delete button again after drag - let user hover again to show it
        // This prevents the button from appearing after drag and being clickable
        
        // evt.stopPropagation();
      });
    }

    function addPolylineDragListeners(polyline: any, map: any) {
      polyline.addEventListener('dragstart', function (evt: any) {
        const pointer = evt.currentPointer;
        const object = evt.target;
        object.setData({
          startCoord: map.screenToGeo(pointer.viewportX, pointer.viewportY),
        });
        
        // Hide delete button during drag
        if (currentDeleteButton && currentShapeForDelete === object) {
          currentDeleteButton.style.display = 'none';
          currentDeleteButton.style.pointerEvents = 'none';
        }
        
        evt.stopPropagation();
      });

      polyline.addEventListener('drag', function (evt: any) {
        const pointer = evt.currentPointer;
        const object = evt.target;
        const startCoord = object.getData()['startCoord'];
        const newCoord = map.screenToGeo(pointer.viewportX, pointer.viewportY);
        let outOfMapView = false;

        if (!newCoord.equals(startCoord)) {
          const currentLineString = object.getGeometry();
          const newLineString = new window.H.geo.LineString();

          currentLineString.eachLatLngAlt(function (lat: number, lng: number) {
            const diffLat = lat - startCoord.lat;
            const diffLng = lng - startCoord.lng;
            const newLat = newCoord.lat + diffLat;
            const newLng = newCoord.lng + diffLng;

            // Prevent dragging to latitude over 90 or -90 degrees
            if (newLat >= 90 || newLat <= -90) {
              outOfMapView = true;
              return;
            }

            newLineString.pushLatLngAlt(newLat, newLng, 0);
          });

          if (!outOfMapView) {
            object.setGeometry(newLineString);
            object.setData({ startCoord: newCoord });
          }
        }
        evt.stopPropagation();
      });

      polyline.addEventListener('dragend', function () {
        // Don't show delete button again after drag - let user hover again to show it
        // This prevents the button from appearing after drag and being clickable
        
        // evt.stopPropagation();
      });
    }

    // Update parent with new shape positions when dragging ends
    const updateParentShapes = () => {
      if (onGeoshapesChange) {
        onGeoshapesChange(drawnShapesRef.current.map(obj => {
          if (obj instanceof window.H.map.Group) {
            const poly = obj.getObjects().find((o: any) => o instanceof window.H.map.Polygon);
            if (poly) return { type: 'polygon', coordinates: poly.getGeometry() };
          } else if (obj instanceof window.H.map.Circle) {
            return { type: 'circle', coordinates: { center: obj.getCenter(), radius: obj.getRadius() } };
          } else if (obj instanceof window.H.map.Polyline) {
            return { type: 'polyline', coordinates: obj.getGeometry() };
          } else if (obj instanceof window.H.map.Rect) {
            return { type: 'rectangle', coordinates: obj.getBoundingBox() };
          }
          // Polygon tidak dihandle untuk parent callback
          return { type: 'unknown', coordinates: null };
        }));
      }
    };

    // Add dragend listeners to update parent and trigger re-routing
    drawnShapesRef.current.forEach((shape) => {
      if (shape.draggable) {
        // Only add dragend listener to draggable shapes (circle, rect, polyline)
        shape.addEventListener('dragend', () => {
          updateParentShapes();
          // Trigger avoid areas update for re-routing
          updateAvoidAreasForRerouting();
        });
      } else if (shape instanceof window.H.map.Group) {
        // For polygon groups, add dragend listener to the polygon inside the group
        const polygon = shape.getObjects().find((o: any) => o instanceof window.H.map.Polygon);
        if (polygon && polygon.draggable) {
          polygon.addEventListener('dragend', () => {
            updateParentShapes();
            // Trigger avoid areas update for re-routing
            updateAvoidAreasForRerouting();
          });
        }
      }
    });

  }, [map, drawnShapesRef, onGeoshapesChange, updateAvoidAreasForRerouting]);
}; 