import { categories, PostNearbySearchResponse } from "@/app/types/googlePlaces"
import z from "zod"

const RequestParams = z.object({
    lat: z.number(),
    long: z.number(),
    category: z.enum(categories)
})

export async function GET(
    req: Request
) {
    const { searchParams } = new URL(req.url)

    const requestParams = {
        lat: parseFloat(searchParams.get("lat") ?? ""),
        long: parseFloat(searchParams.get("long") ?? ""),
        category: searchParams.get("category") ?? ""
    }

    const validationResult = RequestParams.safeParse(requestParams)

    if (!validationResult.success) {
        return new Response(validationResult.error.message, { status: 400 })
    }

    try {
        const data = await postGoogleNearbySearch(requestParams.lat, requestParams.long, requestParams.category)
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