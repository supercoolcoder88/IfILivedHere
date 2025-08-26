import { PostNearbySearchResponse } from "@/app/types/googlePlaces"

export async function GET(
    { params }: { params: { lat: number, long: number } }
) {
    try {
        const data = await postGoogleNearbySearch(params.lat, params.long)
        return Response.json(data)
    } catch (error) {
        console.error(error)

        return new Response("Failed to fetch location data", { status: 500 })
    }
}

const postGoogleNearbySearch = async (lat: number, long: number): Promise<PostNearbySearchResponse> => {
    const placeNearbySearchUrl = new URL("https://places.googleapis.com/v1/places:searchNearby")

    const response = await fetch(placeNearbySearchUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "places.displayName,places.primaryType,places.formattedAddress,places.rating,places.location",
            "X-Goog-Api-Key": process.env.GOOGLE_API_KEY || ""
        },
        body: JSON.stringify({
            "includedTypes": ["restaurant"],
            "maxResultCount": 10,
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": lat,
                        "longitude": long
                    },
                    "radius": 500.0
                }
            }
        })
    })

    if (!response.ok) {
        throw new Error(`Google Place Nearby search API error: ${response.statusText}`)
    }

    const data = await response.json()

    return data as PostNearbySearchResponse
}