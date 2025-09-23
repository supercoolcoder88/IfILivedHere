import { } from "@/app/types/google/places"
import { PostComputeRouteMatrixRequest, PostComputeRouteMatrixResponse } from "@/app/types/google/routes"
import z from "zod"

const WaypointSchema = z.object({
    waypoint: z.object({
        placeId: z.string()
    })
})

const RequestBody = z.object({
    origins: z.array(WaypointSchema),
    destinations: z.array(WaypointSchema),
    travelMode: z.enum(["DRIVE", "BICYCLE", "WALK", "TRANSIT"]),
    units: z.literal("METRIC"),
})

export async function POST(
    req: Request
) {
    const body = await req.json()

    const validationResult = RequestBody.safeParse(body)

    if (!validationResult.success) {
        return new Response(validationResult.error.message, { status: 400 })
    }

    try {
        const data = await postComputeRouteMatrix(body)
        return Response.json(data)
    } catch (error) {
        console.error(error)

        return new Response("Failed to get routes information", { status: 500 })
    }
}

const postComputeRouteMatrix = async (reqBody: PostComputeRouteMatrixRequest): Promise<PostComputeRouteMatrixResponse> => {
    const computeRouteMatrixURL = new URL("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix")

    const response = await fetch(computeRouteMatrixURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "originIndex,destinationIndex,condition,distanceMeters,duration",
            "X-Goog-Api-Key": process.env.GOOGLE_API_KEY || ""
        },
        body: JSON.stringify(reqBody)
    })

    if (!response.ok) {
        throw new Error(`Google Routes API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data as PostComputeRouteMatrixResponse
}