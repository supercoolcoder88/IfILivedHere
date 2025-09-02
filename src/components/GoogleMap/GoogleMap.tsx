import { GetPlaceDetailsResponse } from "@/app/types/googlePlaces";
import { GoogleMap as Map, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useState, useCallback, useMemo } from "react";

interface GoogleMapProps {
    searchedPlace: GetPlaceDetailsResponse | undefined
}

export default function GoogleMap({ searchedPlace }: GoogleMapProps) {
    // Google Map component loading
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""
    })

    const containerStyle = {
        width: "100%",
        height: "600px",
    };

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const defaultCenter = { lat: -37.931024099999995, lng: 145.1611591 };
    // Called when map is ready
    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);

        // Example: Fit map to a single marker
        const bounds = new window.google.maps.LatLngBounds(defaultCenter);
        mapInstance.fitBounds(bounds);
    }, []);

    // Cleanup when map unmounts
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const memoContainerStyle = useMemo(() => containerStyle, []);

    // Don’t render until script is loaded
    if (!isLoaded) return <div>Loading map...</div>;

    return (
        <Map
            mapContainerStyle={memoContainerStyle}
            center={{ lat: searchedPlace?.location.latitude || defaultCenter.lat, lng: searchedPlace?.location.longitude || defaultCenter.lng }}
            zoom={11}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            {
                // Render if place is selected 
                searchedPlace ?
                    <Marker position={{ lat: searchedPlace?.location.latitude || defaultCenter.lat, lng: searchedPlace?.location.longitude || defaultCenter.lng }} />
                    :
                    <></>
            }
        </Map>
    )
}