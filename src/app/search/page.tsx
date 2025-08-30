'use client'
import { useState } from "react"
import { GetPlaceDetailsResponse, NearbyPlacesState, PostAutocompleteResponse, PostNearbySearchResponse } from "../types/googlePlaces"
import { CommandEmpty, CommandInput } from "cmdk";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import GoogleMap from "../../components/GoogleMap/GoogleMap";

interface PlaceSuggestions {
    placeId: string;
    address: string
}

export default function SearchPage() {
    // TODO: Move placeId to a zustand store
    const [searchText, setSearchText] = useState("")
    const [selectedPlaceId, setSelectedPlaceId] = useState("")
    const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestions[]>([])
    const [suggestionSelected, setSuggestionSelected] = useState(false)
    const [searchedPlace, setSearchedPlace] = useState<GetPlaceDetailsResponse>()
    const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlacesState>({
        restaurants: [],
        schools: [],
        grocery: [],
        pharmacy: [],
        generalStore: [],
        hospital: [],
        dental: [],
        gym: [],
        gas_stations: []
    })
    // TODO: Add distance to user workplace

    const autocompleteTextSearch = async (input: string) => {
        // Fetch suggestions for searchText
        if (input.length < 15) {
            return
        }
        try {
            const response = await fetch("/api/search", {
                method: "POST",
                body: JSON.stringify({
                    searchText: input
                })
            })

            const data = await response.json() as PostAutocompleteResponse

            // Check for first 2 suggestions
            const fetchedSuggestions: PlaceSuggestions[] = data.suggestions
                .slice(0, 2)
                .map(s => ({
                    placeId: s.placePrediction.placeId,
                    address: s.placePrediction.text.text
                }))

            setPlaceSuggestions(fetchedSuggestions)
        } catch (error) {
            console.error("Failed to get suggestions", error)
        }
    }

    const categories = ["restaurant", "school", "grocery_store", "pharmacy", "home_goods_store", "hospital", "dentist", "gym", "gas_station"]
    const categoryMapping: { [key: string]: keyof NearbyPlacesState } = {
        restaurant: 'restaurants',
        school: 'schools',
        grocery_store: 'grocery',
        pharmacy: 'pharmacy',
        home_goods_store: 'generalStore',
        hospital: 'hospital',
        dentist: 'dental',
        gym: 'gym',
        gas_station: 'gas_stations',
    }

    const fetchNearbyPlacesPromises = (placeId: string, location: { latitude: number, longitude: number }) => {
        return categories.map(async (category) => {
            try {
                console.log(searchedPlace)
                const nearbySearchUrl = `/api/location/nearby/${placeId}?lat=${location.latitude}&long=${location.longitude}&category=${category}`
                const response = await fetch(nearbySearchUrl)
                const data = (await response.json()) as PostNearbySearchResponse

                return { category, places: data.places }
            } catch (error) {
                console.error("Failed to get nearby place details", error)
            }
        })
    }

    const searchPlaceInformation = async (placeId: string) => {
        // Fetch Place Details
        try {
            const response = await fetch("/api/location/" + placeId)
            const data = (await response.json()) as GetPlaceDetailsResponse

            setSearchedPlace(data)

            // Fetch Nearby data
            const results = await Promise.all(fetchNearbyPlacesPromises(placeId, data.location))

            setNearbyPlaces((prev) => {
                const newState = { ...prev }
                results.forEach(result => {
                    if (!result) return;
                    const { category, places } = result;
                    const stateKey = categoryMapping[category];
                    if (stateKey) {
                        newState[stateKey] = places;
                    }
                })
                return newState
            })
        } catch (error) {
            console.error("Failed to get place details", error)
        }
    }

    console.log(nearbyPlaces)
    const handleAutocompleteSelection = (address: string, placeId: string) => {
        setSearchText(address)
        setSelectedPlaceId(placeId)
        setSuggestionSelected(true)
    }

    return (
        <div>
            <h1>Search page</h1>
            <Command>
                <CommandInput value={searchText} onValueChange={value => { setSearchText(value); autocompleteTextSearch(value) }} placeholder="Search for a place" />
                {
                    suggestionSelected ?
                        <></>
                        :
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            {
                                placeSuggestions.map(suggestion => (
                                    <CommandItem key={suggestion.placeId} onSelect={() => handleAutocompleteSelection(suggestion.address, suggestion.placeId)}>{suggestion.address}</CommandItem>
                                ))
                            }
                        </CommandList>
                }
            </Command>

            <button onClick={() => searchPlaceInformation(selectedPlaceId)}>Search</button>

            <GoogleMap searchedPlace={searchedPlace} />
        </div>
    )
}