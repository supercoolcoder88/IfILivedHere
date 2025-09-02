import { categories, Category, PostNearbySearchResponse } from "@/app/types/googlePlaces"

export async function GET(
    req: Request
) {
    const { searchParams } = new URL(req.url)

    const lat = searchParams.get("lat")
    const long = searchParams.get("long")

    if (!lat || !long) {
        return new Response("Invalid input for lat or long", { status: 400 })
    }

    const category = searchParams.get("category") || ""

    if (!categories.includes(category as Category)) {
        return new Response("Invalid category", { status: 400 });
    }

    try {
        const data = await postGoogleNearbySearch(parseFloat(lat), parseFloat(long), category)
        return Response.json(data)
    } catch (error) {
        console.error(error)

        return new Response("Failed to fetch nearby place data", { status: 500 })
    }
}

const postGoogleNearbySearch = async (lat: number, long: number, category: string): Promise<PostNearbySearchResponse> => {
    const placeNearbySearchUrl = new URL("https://places.googleapis.com/v1/places:searchNearby")

    const response = await fetch(placeNearbySearchUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "places.displayName,places.primaryType,places.formattedAddress,places.rating,places.location,places.businessStatus",
            "X-Goog-Api-Key": process.env.GOOGLE_API_KEY || ""
        },
        body: JSON.stringify({
            includedPrimaryTypes: [category],
            maxResultCount: 11,
            locationRestriction: {
                circle: {
                    center: {
                        latitude: lat,
                        longitude: long
                    },
                    radius: 1000.0
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