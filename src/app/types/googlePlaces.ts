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