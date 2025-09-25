import { NearbyPlacesState, GetPlaceDetailsResponse, PostNearbySearchResponse, NearbyPlace, categories, RoutesData } from "@/app/types/google/places"
import { PostComputeRouteMatrixRequest, RouteMatrixElement } from "@/app/types/google/routes"
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
            const routesData = await getRouteInformation(placeId, nearbyPlaces)
            let count = 0

            const keys = Object.keys(nearbyPlaces) as (keyof NearbyPlacesState)[]
            let keysIterator = 0

            const temp = { ...nearbyPlaces }
            if (routesData) {
                /*
                    routesData will return in batches, each batch is filled to ensure it is below 49 elements and the entire category is
                    sent per batch, meaning no batch will contain a category that is split between two. Thus, we just count the number of 
                    routes iterated and step through the categories when full.
                */
                routesData.forEach((routes) => {
                    routes.DRIVE.sort((a: RouteMatrixElement, b: RouteMatrixElement) => a.destinationIndex - b.destinationIndex)
                    routes.BICYCLE.sort((a: RouteMatrixElement, b: RouteMatrixElement) => a.destinationIndex - b.destinationIndex)
                    routes.WALK.sort((a: RouteMatrixElement, b: RouteMatrixElement) => a.destinationIndex - b.destinationIndex)
                    routes.TRANSIT.sort((a: RouteMatrixElement, b: RouteMatrixElement) => a.destinationIndex - b.destinationIndex)
                    for (let i = 0; i < routes.DRIVE.length; i++) {
                        const key = keys[keysIterator]
                        temp[keys[keysIterator]][count] = {
                            ...temp[key][count],
                            routes: {
                                drive: routes.DRIVE[i],
                                bicycle: routes.BICYCLE[i],
                                walk: routes.WALK[i],
                                transit: routes.TRANSIT[i]
                            }
                        }

                        count += 1

                        if (count >= temp[key].length) {
                            keysIterator += 1
                            count = 0
                        }
                    }
                })

                setNearbyPlaces(temp)
            }
            // TODO: Count nearbyplaces
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
            const routesData = await Promise.all(
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

            return routesData

        } catch (error) {
            console.error("Error fetching route: ", error)
        }
    }



    return { searchedPlace, nearbyPlaces, searchPlaceInformation, nearbySearchApiState }
}