export interface GetPlaceDetailsResponse {
    id: string;
    formattedAddress: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

export interface PostAutocompleteResponse {
    suggestions: {
        placePrediction: {
            place: string;
            placeId: string;
            text: {
                text: string;
                matches?: { startOffset?: number; endOffset: number }[];
            };
            structuredFormat: {
                mainText: {
                    text: string;
                    matches?: { startOffset?: number; endOffset: number }[];
                };
                secondaryText: {
                    text: string;
                };
            };
            types: string[];
        };
    }[];
}

export interface NearbyPlace {
    location: {
        latitude: number;
        longitude: number;
    };
    rating?: number;
    formattedAddress: string;
    displayName: {
        text: string;
        languageCode: string;
    };
    primaryType: string;
    businessStatus: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY"
}

export interface PostNearbySearchResponse {
    places: NearbyPlace[];
}

export interface NearbyPlacesState {
    restaurants: NearbyPlace[];
    cafes: NearbyPlace[];
    schools: NearbyPlace[];
    grocery: NearbyPlace[];
    pharmacy: NearbyPlace[];
    generalStore: NearbyPlace[];
    hospital: NearbyPlace[];
    dental: NearbyPlace[];
    gym: NearbyPlace[];
    gas_stations: NearbyPlace[];
}

export const categories = [
    "restaurant",
    "cafe",
    "school",
    "grocery_store",
    "pharmacy",
    "home_goods_store",
    "hospital",
    "dentist",
    "gym",
    "gas_station"
] as const;

// narrow union type from the array
export type Category = typeof categories[number];