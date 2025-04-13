import React, { useEffect } from "react";

const getMapKitToken = async (): Promise<string> => {
  const token =
    "eyJraWQiOiJNWUQ1MkxCUjVQIiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI4V1ZLUzJGMjRDIiwiaWF0IjoxNzQ0MjkyNDQ3LCJleHAiOjE3NDQ5NTk1OTl9.ims988bUGp24ntV-cfGhK5LYZQ3-vATmoM5sbyS3ioGEc_GZJk012UcB4OE5rA9RYmFaNVYG76b0g0YR9kgEEA";

  if (!token) {
    console.error("MapKit token not found in environment variables");
    throw new Error(
      "MapKit token not configured. Please set MAPKIT_TOKEN environment variable.",
    );
  }

  return token;
};

// Component to initialize MapKit JS
interface MapKitInitializerProps {
  onMapReady: (map: any) => void;
}

const MapKitInitializer: React.FC<MapKitInitializerProps> = ({ onMapReady }) => {
  useEffect(() => {
    const loadMapKit = async () => {
      try {
        // Load MapKit JS script if not already loaded
        if (!window.mapkit) {
          const script = document.createElement("script");
          script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
          script.async = true;
          document.head.appendChild(script);

          await new Promise<void>((resolve) => {
            script.onload = () => resolve();
          });
        }

        // Initialize MapKit with JWT token
        const token = await getMapKitToken();
        window.mapkit.init({
          authorizationCallback: (done: (token: string) => void) => {
            done(token);
          },
        });
      } catch (error) {
        console.error("Failed to initialize MapKit JS:", error);
      }
    };

    loadMapKit();
  }, []);

  return null;
};

export default MapKitInitializer;
