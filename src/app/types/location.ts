export interface GetPlaceDetailsResponse {
    id: string;
    formattedAddress: string;
    location: {
        latitude: number;
        longitude: number;
    };
}