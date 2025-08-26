import { GetPlaceDetailsResponse } from "@/app/types/googlePlaces"

export async function GET(
    req: Request,
    { params }: { params: { placeId: string } }
) {
    const { placeId } = await params
    try {
        const data = await getGooglePlaceDetails(placeId)
        return Response.json(data)
    } catch (error) {
        console.error(error)

        return new Response("Failed to fetch location data", { status: 500 })
    }
}

const getGooglePlaceDetails = async (placeId: string): Promise<GetPlaceDetailsResponse> => {
    const placeDetailsUrl = new URL("https://places.googleapis.com/v1/places/" + placeId)
    placeDetailsUrl.searchParams.append("key", process.env.GOOGLE_API_KEY || "")

    const response = await fetch(placeDetailsUrl, {
        headers: {
            "X-Goog-FieldMask": "id,location,formattedAddress"
        }
    })

    if (!response.ok) {
        throw new Error(`Google Place Details API error: ${response.statusText}`)
    }

    const data = await response.json()

    return data as GetPlaceDetailsResponse
}