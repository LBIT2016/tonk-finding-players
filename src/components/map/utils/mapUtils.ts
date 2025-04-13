// Helper functions for map operations

// Add a temporary marker to the map
export const addTemporaryMarker = (
  mapkit: any,
  mapInstance: any,
  markers: any[],
  latitude: number,
  longitude: number,
  title: string = "New Game Community",
  color: string = "#34C759"
) => {
  // Remove any existing temporary marker
  const tempMarker = markers.find((m) => m.isTemporary);
  if (tempMarker) {
    mapInstance.removeAnnotation(tempMarker);
  }

  // Add new temporary marker
  const marker = new mapkit.MarkerAnnotation(
    new mapkit.Coordinate(latitude, longitude),
    {
      color: color,
      title: title,
      glyphText: "+",
    }
  );
  marker.isTemporary = true;

  mapInstance.addAnnotation(marker);
  
  return [...markers.filter((m) => !m.isTemporary), marker];
};

// Remove temporary markers from the map
export const removeTemporaryMarkers = (
  mapInstance: any,
  markers: any[]
) => {
  const tempMarkers = markers.filter((m) => m.isTemporary);
  if (tempMarkers.length > 0) {
    mapInstance.removeAnnotations(tempMarkers);
  }
  return markers.filter((m) => !m.isTemporary);
};

// Calculate map span based on zoom level
export const calculateSpanFromZoom = (
  zoomLevel: number
): number => {
  return 0.01 * Math.pow(2, 15 - zoomLevel);
};

// Set map region 
export const setMapRegion = (
  mapkit: any,
  mapInstance: any,
  center: [number, number],
  zoomLevel: number = 15
) => {
  const span = calculateSpanFromZoom(zoomLevel);
  
  mapInstance.region = new mapkit.CoordinateRegion(
    new mapkit.Coordinate(center[0], center[1]),
    new mapkit.CoordinateSpan(span, span)
  );
};
