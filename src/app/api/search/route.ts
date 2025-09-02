import { PostAutocompleteResponse } from "@/app/types/googlePlaces"
import { geolocation } from "@vercel/functions"
import z from "zod"

const RequestParams = z.object({
    searchText: z.string().min(3),
    // lat: z.float32(),
    // long: z.float32()
})

export async function POST(
    request: Request
) {
    const body = await request.json()

    const validationResult = RequestParams.safeParse(body)

    if (!validationResult.success) {
        return new Response(validationResult.error.message, { status: 400 })
    }

    const { latitude, longitude } = geolocation(request)

    try {
        const data = await postGooglePlaceAutocomplete(body.searchText, parseFloat(latitude || "0"), parseFloat(longitude || "0"))
        return Response.json(data)
    } catch (error) {
        console.error(error)

        return new Response("Failed to autocomplete search", { status: 500 })
    }

}

const postGooglePlaceAutocomplete = async (searchText: string, lat: number, long: number): Promise<PostAutocompleteResponse> => {
    const placeAutocompleteUrl = new URL("https://places.googleapis.com/v1/places:autocomplete")

    const response = await fetch(placeAutocompleteUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.GOOGLE_API_KEY || ""
        },
        body: JSON.stringify({
            input: searchText,
            includedPrimaryTypes: [
                "premise",
                "establishment",
                "street_address",
                "subpremise"
            ],
            // regionCode: "AU",
            // locationBias: {
            //     circle: {
            //         center: { latitude: lat, longitude: long },
            //         radius: 50000.0
            //     }
            // }
        })
    })

    if (!response.ok) {
        throw new Error(`Google Autocomplete API error: ${response.statusText}`)
    }

    const data = await response.json()

    return data
}