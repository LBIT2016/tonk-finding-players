/**
 * Utility for managing map pins, including handling overlapping callouts
 */

interface MapPinManagerOptions {
  clusteringDistance: number; // Distance in pixels to cluster pins
  mapInstance: any; // Reference to the mapkit map instance
}

export class MapPinManager {
  private mapInstance: any;
  private markers: any[] = [];
  private activeCallout: any | null = null;
  private clusteringDistance: number;
  private onClusterSelect: ((markers: any[]) => void) | null = null;

  constructor(options: MapPinManagerOptions) {
    this.mapInstance = options.mapInstance;
    this.clusteringDistance = options.clusteringDistance || 40;
  }

  /**
   * Set callback for cluster selection
   */
  setClusterSelectCallback(callback: (markers: any[]) => void): void {
    this.onClusterSelect = callback;
  }

  /**
   * Add markers to the map with clustering and single-callout management
   */
  addMarkers(markers: any[]): void {
    // Remove any existing markers
    this.clearMarkers();
    
    // Apply clustering if needed
    const clusteredMarkers = this.clusterMarkers(markers);
    
    // Add all markers to the map
    this.mapInstance.addAnnotations(clusteredMarkers);
    this.markers = clusteredMarkers;
    
    // Setup click event listeners on the map to close popups when clicking elsewhere
    if (!this.mapInstance.__pinManagerClickHandler) {
      this.mapInstance.__pinManagerClickHandler = (event: any) => {
        // If we click on the map (not on a marker), close any open callout
        if (event.target && event.target === this.mapInstance) {
          this.closeActiveCallout();
        }
      };
      this.mapInstance.addEventListener('click', this.mapInstance.__pinManagerClickHandler);
    }
  }
  
  /**
   * Clear all markers from the map
   */
  clearMarkers(): void {
    if (this.markers.length) {
      this.mapInstance.removeAnnotations(this.markers);
      this.markers = [];
    }
    this.activeCallout = null;
  }
  
  /**
   * Cluster markers that are too close together
   */
  private clusterMarkers(markers: any[]): any[] {
    // If we have no map or less than 2 markers, no need to cluster
    if (!this.mapInstance || markers.length < 2) {
      return markers;
    }
    
    const clusters: any[] = [];
    const clusterGroups: any[][] = [];
    
    // Group markers by proximity on screen
    markers.forEach(marker => {
      // Don't cluster temporary markers
      if (marker.isTemporary) {
        clusters.push(marker);
        return;
      }
      
      // Get marker position in screen coordinates
      const markerPoint = this.mapInstance.convertCoordinateToPointOnPage(marker.coordinate);
      
      // Check if this marker is close to an existing cluster
      let addedToCluster = false;
      
      for (const group of clusterGroups) {
        // Use the first marker in the group as reference
        const groupMarker = group[0];
        const groupPoint = this.mapInstance.convertCoordinateToPointOnPage(groupMarker.coordinate);
        
        // Calculate distance in pixels
        const dx = markerPoint.x - groupPoint.x;
        const dy = markerPoint.y - groupPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.clusteringDistance) {
          group.push(marker);
          addedToCluster = true;
          break;
        }
      }
      
      // If not added to any cluster, create a new group
      if (!addedToCluster) {
        clusterGroups.push([marker]);
      }
    });
    
    // Process each group
    clusterGroups.forEach(group => {
      if (group.length === 1) {
        // Single marker - no need to cluster
        clusters.push(group[0]);
      } else {
        // Create a cluster marker
        const clusterCoordinate = this.calculateClusterCenter(group);
        
        // Create cluster annotation
        const clusterMarker = new window.mapkit.MarkerAnnotation(clusterCoordinate, {
          color: "#007AFF", // Blue color for clusters
          glyphText: group.length.toString(),
          displayPriority: 1000,
          size: { width: 36, height: 36 },
          animates: true
        });
        
        // Store the original markers in the cluster
        clusterMarker.__clusterMarkers = group;
        clusterMarker.__isCluster = true; // Mark this as a cluster marker
        
        // Setup callout for the cluster
        clusterMarker.callout = {
          calloutElementForAnnotation: (annotation: any) => {
            return this.createClusterCallout(annotation.__clusterMarkers || []);
          }
        };
        
        // Add event handling to ensure only one popup is shown at a time
        const originalHandleEvent = clusterMarker.handleEvent;
        clusterMarker.handleEvent = (event: any) => {
          if (event.type === 'select') {
            // Allow tapping to show the popup
            this.handleMarkerSelect(clusterMarker);
            
            // Notify external listener if available
            if (this.onClusterSelect && clusterMarker.__clusterMarkers) {
              this.onClusterSelect(clusterMarker.__clusterMarkers);
            }
          }
          return originalHandleEvent.call(clusterMarker, event);
        };
        
        clusters.push(clusterMarker);
      }
    });
    
    return clusters;
  }
  
  /**
   * Creates a custom callout element for a cluster of markers
   */
  private createClusterCallout(markers: any[]): HTMLElement {
    const calloutElement = document.createElement("div");
    calloutElement.className = "mapkit-cluster-callout";
    
    // Apply Apple-style CSS
    calloutElement.style.padding = "12px";
    calloutElement.style.maxWidth = "300px";
    calloutElement.style.backgroundColor = "white";
    calloutElement.style.borderRadius = "14px";
    calloutElement.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.12)";
    calloutElement.style.border = "none";
    calloutElement.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";
      
    // Add heading
    const heading = document.createElement("h3");
    heading.style.fontSize = "15px";
    heading.style.fontWeight = "600";
    heading.style.marginBottom = "10px";
    heading.style.color = "#000";
    heading.textContent = `${markers.length} Locations`;
    calloutElement.appendChild(heading);
    
    // Create location list
    const locationList = document.createElement("div");
    locationList.style.maxHeight = "200px";
    locationList.style.overflowY = "auto";
    locationList.style.marginBottom = "8px";
    
    // Add each location as a clickable item
    markers.forEach((marker, index) => {
      const locationItem = document.createElement("div");
      locationItem.style.padding = "8px 10px";
      locationItem.style.borderRadius = "8px";
      locationItem.style.cursor = "pointer";
      locationItem.style.marginBottom = "4px";
      locationItem.style.display = "flex";
      locationItem.style.justifyContent = "space-between";
      locationItem.style.alignItems = "center";
      locationItem.style.backgroundColor = "#f5f5f7";
      locationItem.style.transition = "background-color 0.2s";
      
      // Left side with name and subtitle (with max width to prevent overflow)
      const infoDiv = document.createElement("div");
      infoDiv.style.flexGrow = "1";
      infoDiv.style.marginRight = "10px"; // Add space between text and button
      infoDiv.style.overflow = "hidden"; // Prevent overflow
      
      // Name
      const nameElement = document.createElement("div");
      nameElement.style.fontWeight = "500";
      nameElement.style.fontSize = "14px";
      nameElement.style.color = "#333"; // Darker text color for better contrast
      nameElement.style.whiteSpace = "nowrap";
      nameElement.style.overflow = "hidden";
      nameElement.style.textOverflow = "ellipsis";
      nameElement.style.maxWidth = "180px"; // Limit width to prevent long titles from pushing the button
      nameElement.textContent = marker.title || "Location";
      infoDiv.appendChild(nameElement);
      
      // Subtitle if available
      if (marker.subtitle) {
        const subtitleElement = document.createElement("div");
        subtitleElement.style.fontSize = "12px";
        subtitleElement.style.color = "#666"; // Darker subtitle color
        subtitleElement.style.whiteSpace = "nowrap";
        subtitleElement.style.overflow = "hidden";
        subtitleElement.style.textOverflow = "ellipsis";
        subtitleElement.textContent = marker.subtitle;
        infoDiv.appendChild(subtitleElement);
      }
      
      locationItem.appendChild(infoDiv);
      
      // Button
      const viewButton = document.createElement("button");
      viewButton.style.fontSize = "12px";
      viewButton.style.padding = "4px 8px";
      viewButton.style.backgroundColor = "#007AFF";
      viewButton.style.color = "white";
      viewButton.style.border = "none";
      viewButton.style.borderRadius = "12px";
      viewButton.style.cursor = "pointer";
      viewButton.style.flexShrink = "0"; // Prevent button from shrinking
      viewButton.textContent = "View";
      locationItem.appendChild(viewButton);
      
      // Hover effect
      locationItem.addEventListener("mouseover", () => {
        locationItem.style.backgroundColor = "#e9e9eb";
      });
      locationItem.addEventListener("mouseout", () => {
        locationItem.style.backgroundColor = "#f5f5f7";
      });
      
      // Add button hover effect
      viewButton.addEventListener("mouseover", () => {
        viewButton.style.backgroundColor = "#0062cc"; // Darker blue on hover
      });
      viewButton.addEventListener("mouseout", () => {
        viewButton.style.backgroundColor = "#007AFF";
      });
      
      // Click handler for View button specifically
      viewButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering the parent click
        e.preventDefault(); // Prevent any default action
        
        // Close this cluster callout first
        this.closeActiveCallout();
        
        // Force a slightly longer delay to ensure the popup is fully closed
        // before opening a new one - this is critical for MapKit to work properly
        setTimeout(() => {
          console.log('View button clicked for:', marker.title);
          this.forceShowMarkerCallout(marker);
        }, 150); // Increased delay for better reliability
      });
      
      // Click handler for the entire location item
      locationItem.addEventListener("click", () => {
        // Close this cluster callout
        this.closeActiveCallout();
        
        // Force a small delay to ensure the popup is fully closed before opening a new one
        setTimeout(() => {
          // Select the individual marker and show its callout
          this.selectSpecificMarker(marker);
        }, 50);
      });
      
      locationList.appendChild(locationItem);
    });
    
    calloutElement.appendChild(locationList);
    
    // Add a button to zoom in
    const zoomButton = document.createElement("button");
    zoomButton.style.width = "100%";
    zoomButton.style.padding = "8px";
    zoomButton.style.backgroundColor = "#f2f2f7";
    zoomButton.style.border = "none";
    zoomButton.style.borderRadius = "8px";
    zoomButton.style.fontSize = "13px";
    zoomButton.style.fontWeight = "500";
    zoomButton.style.color = "#007AFF";
    zoomButton.style.cursor = "pointer";
    zoomButton.textContent = "Zoom to See All";
    
    zoomButton.addEventListener("mouseover", () => {
      zoomButton.style.backgroundColor = "#e5e5ea";
    });
    zoomButton.addEventListener("mouseout", () => {
      zoomButton.style.backgroundColor = "#f2f2f7";
    });
    
    zoomButton.addEventListener("click", () => {
      // Close callout
      this.closeActiveCallout();
      
      // Zoom the map to show all markers in this cluster
      this.zoomToShowCluster(markers);
    });
    
    calloutElement.appendChild(zoomButton);
    
    return calloutElement;
  }
  
  /**
   * Force a marker to show its callout with a more direct approach
   * This is a new method specifically for handling the View button click
   */
  private forceShowMarkerCallout(marker: any): void {
    if (!marker || typeof marker.coordinate === 'undefined') {
      console.warn('Cannot show callout - invalid marker', marker);
      return;
    }
    
    try {
      // First ensure we have no active callout
      this.closeActiveCallout();
      
      // Set as active callout
      this.activeCallout = marker;
      
      // Center on the marker first
      this.mapInstance.setCenterAnimated(marker.coordinate);
      
      // Explicitly set selection flags
      marker.selected = true;
      
      // Set as selectedAnnotation - this is the key property for MapKit
      this.mapInstance.selectedAnnotation = marker;
      
      // If the marker has a callout element generator function, manually call it
      // and inject the element into the DOM - this is a fallback approach
      if (marker.callout && typeof marker.callout.calloutElementForAnnotation === 'function') {
        console.log('Manually creating callout element for:', marker.title);
        
        // Remove any existing custom callout
        const existingCallout = document.querySelector('.manual-callout');
        if (existingCallout) {
          existingCallout.remove();
        }
        
        // In some MapKit versions, we need to manually show the callout
        const calloutElement = marker.callout.calloutElementForAnnotation(marker);
        if (calloutElement) {
          // Add positioning and classes
          calloutElement.style.position = 'absolute';
          calloutElement.style.zIndex = '10000';
          calloutElement.classList.add('manual-callout');
          
          // This is a fallback method that we only use if detection shows MapKit
          // isn't showing the callout on its own (uncomment if needed)
          /*
          setTimeout(() => {
            // Check if MapKit showed the callout on its own
            const mapkitCallouts = document.querySelectorAll('.mapkit-callout');
            if (mapkitCallouts.length === 0) {
              // If not, add our manual one
              document.body.appendChild(calloutElement);
              
              // Position it above the marker
              const point = this.mapInstance.convertCoordinateToPointOnPage(marker.coordinate);
              calloutElement.style.left = `${point.x - (calloutElement.offsetWidth / 2)}px`;
              calloutElement.style.top = `${point.y - calloutElement.offsetHeight - 10}px`;
            }
          }, 100);
          */
        }
      }
      
      // Trigger a MapKit internal update to refresh the UI
      if (this.mapInstance.annotations) {
        const annotations = [...this.mapInstance.annotations];
        this.mapInstance.annotations = [];
        this.mapInstance.annotations = annotations;
      }
      
      console.log('Marker callout should now be visible:', marker.title);
    } catch (e) {
      console.error('Error forcing marker callout:', e);
    }
  }
  
  /**
   * Select a specific marker - keeping for backward compatibility
   */
  private selectSpecificMarker(marker: any): void {
    this.forceShowMarkerCallout(marker);
  }
  
  /**
   * Calculate the center coordinate for a cluster
   */
  private calculateClusterCenter(markers: any[]): any {
    if (!markers.length) return null;
    
    // Average latitude and longitude
    let totalLat = 0;
    let totalLng = 0;
    
    markers.forEach(marker => {
      totalLat += marker.coordinate.latitude;
      totalLng += marker.coordinate.longitude;
    });
    
    return new window.mapkit.Coordinate(
      totalLat / markers.length,
      totalLng / markers.length
    );
  }
  
  /**
   * Zoom the map to show all markers in a cluster
   */
  private zoomToShowCluster(markers: any[]): void {
    if (markers.length <= 1) return;
    
    // Calculate bounds that include all markers
    const points = markers.map((m: any) => m.coordinate);
    
    // Start with the first point
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;
    
    // Find the min/max coordinates
    points.forEach((point: any) => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });
    
    // Add padding
    const latPad = (maxLat - minLat) * 0.2;
    const lngPad = (maxLng - minLng) * 0.2;
    
    // Create a padded coordinate region
    const center = new window.mapkit.Coordinate(
      (minLat + maxLat) / 2,
      (minLng + maxLng) / 2
    );
    
    const span = new window.mapkit.CoordinateSpan(
      Math.max(0.005, (maxLat - minLat) + latPad),
      Math.max(0.005, (maxLng - minLng) + lngPad)
    );
    
    // Set the map region
    this.mapInstance.setRegionAnimated(
      new window.mapkit.CoordinateRegion(center, span)
    );
  }
  
  /**
   * Ensure only one callout is visible at a time
   */
  handleMarkerSelect(marker: any): void {
    // Close any previously open callout
    this.closeActiveCallout();
    
    // Set this as the active callout
    this.activeCallout = marker;
  }
  
  /**
   * Close currently active callout
   */
  closeActiveCallout(): void {
    if (this.activeCallout) {
      // Deselect the marker to close its callout
      if (this.activeCallout.selected) {
        this.activeCallout.selected = false;
      }
      this.activeCallout = null;
    }
  }
  
  /**
   * Clean up event listeners when no longer needed
   */
  destroy(): void {
    if (this.mapInstance && this.mapInstance.__pinManagerClickHandler) {
      this.mapInstance.removeEventListener('click', this.mapInstance.__pinManagerClickHandler);
      delete this.mapInstance.__pinManagerClickHandler;
    }
    this.clearMarkers();
  }
}
