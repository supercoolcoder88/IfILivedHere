import { NearbyPlacesState, GetPlaceDetailsResponse, PostNearbySearchResponse, NearbyPlace, categories } from "@/app/types/googlePlaces"
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
            const response = await fetch("/api/location/" + placeId)
            const data = (await response.json()) as GetPlaceDetailsResponse
            setSearchedPlace(data)

            // Fetch nearby categories
            const results = await Promise.all(
                categories.map(async category => {
                    try {
                        const nearbySearchUrl =
                            `/api/location/nearby/${placeId}?lat=${data.location.latitude}&long=${data.location.longitude}&category=${category}&radius=${radius}`
                        const res = await fetch(nearbySearchUrl)
                        const json = (await res.json()) as PostNearbySearchResponse
                        return { category, places: Array.isArray(json.places) ? json.places : [] }
                    } catch (err) {
                        console.error("Nearby fetch failed:", err)
                        return null
                    }
                })
            )

            // Update state
            setNearbyPlaces((prev: NearbyPlacesState) => {
                const newState = { ...prev }
                results.forEach(result => {
                    if (!result) return
                    const { category, places } = result
                    const stateKey = categoryMapping[category]
                    if (stateKey) {
                        newState[stateKey] = filterNearbySearch(places)
                    }
                })
                return newState
            })

            setNearbySearchApiState("done")
        } catch (error) {
            console.error("Fetching nearby places fail", error)
        }
    }

    return { searchedPlace, nearbyPlaces, searchPlaceInformation, nearbySearchApiState }
}

function filterNearbySearch(places: NearbyPlace[]) {
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