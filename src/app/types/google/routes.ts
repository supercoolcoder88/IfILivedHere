export interface PostComputeRouteMatrixRequest {
    origins: Waypoint[];
    destinations: Waypoint[];
    travelMode: "DRIVE" | "BICYCLE" | "WALK" | "TRANSIT";
    units: "METRIC";
}

export interface Waypoint {
    waypoint: {
        placeId: string;
        // or latLng: { latitude: number; longitude: number }
    }
}

export interface RouteMatrixElement {
    id?: string;
    originIndex: number;
    destinationIndex: number;
    distanceMeters: number;
    duration: string; // 10s
    condition: "ROUTE_EXISTS" | "ROUTE_NOT_FOUND";
}

export type PostComputeRouteMatrixResponse = RouteMatrixElement[];