import { } from "@/app/types/google/places"
import { PostComputeRouteMatrixRequest, PostComputeRouteMatrixResponse, RouteMatrixElement } from "@/app/types/google/routes"
import { Key } from "lucide-react"
import z from "zod"

const WaypointSchema = z.object({
    waypoint: z.object({
        placeId: z.string()
    })
})

const RequestBody = z.object({
    origins: z.array(WaypointSchema),
    destinations: z.array(WaypointSchema)
})

const travelModeTypes = ["DRIVE", "BICYCLE", "WALK", "TRANSIT"]

export async function POST(
    req: Request
) {
    const body = await req.json()

    const validationResult = RequestBody.safeParse(body)

    if (!validationResult.success) {
        return new Response(validationResult.error.message, { status: 400 })
    }

    try {
        // Calls the Routes API for computeRouteMatrix
        const res = await Promise.all(
            travelModeTypes.map(async mode => {
                const data = await postComputeRouteMatrix({
                    ...body,
                    units: "METRIC",
                    travelMode: mode
                })
                return [mode, data] as const
            })
        ).then(Object.fromEntries)

        // Map responses with placeID based on index
        for (const mode in res) {
            res[mode] = res[mode].map((route: RouteMatrixElement) => ({
                ...route,
                id: body.destinations[route.destinationIndex].waypoint.placeId
            }))
        }

        return Response.json(res)
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