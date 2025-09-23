import { categories, NearbyPlace, PostNearbySearchResponse } from "@/app/types/google/places"
import z from "zod"

const RequestParams = z.object({
    lat: z.number(),
    long: z.number(),
    radius: z.string()
})

export async function GET(
    req: Request
) {
    const { searchParams } = new URL(req.url)

    const requestParams = {
        lat: parseFloat(searchParams.get("lat") ?? ""),
        long: parseFloat(searchParams.get("long") ?? ""),
        radius: searchParams.get("radius") ?? "",
    }

    const validationResult = RequestParams.safeParse(requestParams)

    if (!validationResult.success) {
        return new Response(validationResult.error.message, { status: 400 })
    }

    try {
        const nearbyPlaces = await Promise.all(
            categories.map(async category => {
                const res = await postGoogleNearbySearch(requestParams.lat, requestParams.long, category, requestParams.radius)
                const filtered = filterNearbySearchResult(res.places)
                return { [category]: filtered }
            })
        )

        return Response.json(nearbyPlaces)
    } catch (error) {
        console.error(error)

        return new Response("Failed to fetch nearby place data", { status: 500 })
    }
}

const postGoogleNearbySearch = async (lat: number, long: number, category: string, radius: string): Promise<PostNearbySearchResponse> => {
    const placeNearbySearchUrl = new URL("https://places.googleapis.com/v1/places:searchNearby")

    const response = await fetch(placeNearbySearchUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "places.displayName,places.primaryType,places.formattedAddress,places.rating,places.location,places.businessStatus,places.id",
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
                    radius: parseFloat(radius)
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

function filterNearbySearchResult(places: NearbyPlace[]) {
    const uniqueAddresses = new Set<string>()

    return places.filter(place => {
        // Must be Operational
        if (place.businessStatus !== "OPERATIONAL") return false
        // Must have an address
        if (place.formattedAddress === undefined || place.formattedAddress.length === 0) return false
        // Must be unique address
        if (uniqueAddresses.has(place.formattedAddress)) return false
        uniqueAddresses.add(place.formattedAddress)
        return true
    })
}