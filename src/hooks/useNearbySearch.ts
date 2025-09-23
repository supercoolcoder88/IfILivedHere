import { NearbyPlacesState, GetPlaceDetailsResponse, PostNearbySearchResponse, NearbyPlace, categories } from "@/app/types/google/places"
import { useState } from "react"

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
            const nearbyPlaces = (await nearbySearchResponse.json()) as NearbyPlacesState
            setNearbyPlaces(nearbyPlaces)
            setNearbySearchApiState("done")
        } catch (error) {
            console.error("Fetching nearby places fail", error)
        }
    }

    return { searchedPlace, nearbyPlaces, searchPlaceInformation, nearbySearchApiState }
}