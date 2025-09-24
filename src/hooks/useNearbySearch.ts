import { NearbyPlacesState, GetPlaceDetailsResponse, PostNearbySearchResponse, NearbyPlace, categories } from "@/app/types/google/places"
import { PostComputeRouteMatrixRequest } from "@/app/types/google/routes"
import { PaletteIcon } from "lucide-react"
import { useState } from "react"
import { json } from "zod"

export const categoryMapping: { [key: string]: keyof NearbyPlacesState } = {
    restaurant: "restaurants",
    cafe: "cafes",
    school: "schools",
    grocery_store: "grocery",
    pharmacy: "pharmacy",
    home_goods_store: "generalStore",
    hospital: "hospital",
    dentist: "dental",
    gym: "gym",
    gas_station: "gasStation",
    shopping_mall: "shoppingMall",
    bus_stop: "busStop",
    train_station: "trainStation"
}

export function useNearbySearch() {
    const [searchedPlace, setSearchedPlace] = useState<GetPlaceDetailsResponse>()
    const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlacesState>({
        restaurants: [],
        cafes: [],
        schools: [],
        grocery: [],
        pharmacy: [],
        generalStore: [],
        hospital: [],
        dental: [],
        gym: [],
        gasStation: [],
        shoppingMall: [],
        busStop: [],
        trainStation: []
    })

    const [nearbySearchApiState, setNearbySearchApiState] = useState<"empty" | "loading" | "done">("empty")

    const searchPlaceInformation = async (placeId: string, radius: number) => {
        if (placeId.length === 0) {
            throw new Error("Invalid Place ID")
        }

        try {
            // Fetch main place details
            const placeDetailsResponse = await fetch("/api/location/" + placeId)
            const placeDetails = (await placeDetailsResponse.json()) as GetPlaceDetailsResponse

            setSearchedPlace(placeDetails)

            // Fetch nearby places
            const nearbySearchUrl =
                `/api/location/nearby/${placeId}?lat=${placeDetails.location.latitude}&long=${placeDetails.location.longitude}&radius=${radius}`
            const nearbySearchResponse = await fetch(nearbySearchUrl)
            const nearbyPlaces = await nearbySearchResponse.json()
            setNearbyPlaces(nearbyPlaces)
            setNearbySearchApiState("done")

            // Get the route information after nearby place is rendered
            getRouteInformation(placeId, nearbyPlaces)
        } catch (error) {
            console.error("Fetching nearby places fail", error)
        }
    }

    const getRouteInformation = async (homeId: string, nearbyPlaces: NearbyPlacesState) => {
        const callQueue = Object.values(nearbyPlaces)
            .flat()
            .reduce<typeof nearbyPlaces[keyof typeof nearbyPlaces][number][][]>(
                (batches, place) => {
                    const lastBatch = batches[batches.length - 1]
                    if (!lastBatch || lastBatch.length === 49) {
                        batches.push([place])
                    } else {
                        lastBatch.push(place)
                    }

                    return batches
                }, []
            )

        try {
            const res = await Promise.all(
                callQueue.map(async batch => {
                    const destinations = Object.values(batch).flat().map(place => (
                        {
                            waypoint: {
                                placeId: place.id
                            }
                        }
                    ))

                    const requestBody = {
                        origins: [
                            {
                                waypoint: {
                                    placeId: homeId
                                }
                            }
                        ],
                        destinations: destinations
                    }

                    const data = await fetch("/api/route", {
                        method: "POST",
                        body: JSON.stringify(requestBody)
                    })

                    const res = await data.json()
                    return res
                })
            )

            console.log(res)

        } catch (error) {
            console.error("Error fetching route: ", error)
        }
    }



    return { searchedPlace, nearbyPlaces, searchPlaceInformation, nearbySearchApiState }
}