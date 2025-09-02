import { PostAutocompleteResponse } from "@/app/types/googlePlaces"
import z from "zod"

const RequestParams = z.object({
    searchText: z.string().min(3)
})

export async function POST(
    request: Request
) {
    const body = await request.json()
    const searchText = body.searchText

    const validationResult = RequestParams.safeParse(searchText)

    if (!validationResult.success) {
        return new Response(validationResult.error.message, { status: 400 })
    }

    try {
        const data = await postGooglePlaceAutocomplete(searchText)
        return Response.json(data)
    } catch (error) {
        console.error(error)

        return new Response("Failed to autocomplete search", { status: 500 })
    }
}

const postGooglePlaceAutocomplete = async (searchText: string): Promise<PostAutocompleteResponse> => {
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
            ]
        })
    })

    if (!response.ok) {
        throw new Error(`Google Autocomplete API error: ${response.statusText}`)
    }

    const data = await response.json()

    return data
}