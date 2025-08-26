'use client'
import { useCallback, useMemo, useState } from "react"
import { GetPlaceDetailsResponse, PostAutocompleteResponse } from "../types/googlePlaces"
import { CommandEmpty, CommandInput } from "cmdk";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

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

    const getPlaceDetails = async (placeId: string) => {
        try {
            const response = await fetch("/api/location/" + placeId)
            const data = (await response.json()) as GetPlaceDetailsResponse

            setSearchedPlace(data)
        } catch (error) {
            console.error("Failed to get place details", error)
        }
    }

    const handleAutocompleteSelection = (address: string, placeId: string) => {
        setSearchText(address)
        setSelectedPlaceId(placeId)
        setSuggestionSelected(true)
    }

    // Google Map component loading
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ""
    })

    const containerStyle = {
        width: "100%",
        height: "400px",
    };

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const center = { lat: -37.931024099999995, lng: 145.1611591 };
    // Called when map is ready
    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);

        // Example: Fit map to a single marker
        const bounds = new window.google.maps.LatLngBounds(center);
        mapInstance.fitBounds(bounds);
    }, []);

    // Cleanup when map unmounts
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const memoContainerStyle = useMemo(() => containerStyle, []);

    // Don’t render until script is loaded
    if (!isLoaded) return <div>Loading map...</div>;


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

            <button onClick={() => getPlaceDetails(selectedPlaceId)}>Search</button>

            <GoogleMap
                mapContainerStyle={memoContainerStyle}
                center={center}
                zoom={11}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                }}
            >
                {
                    // Render if place is selected 
                    searchedPlace ?
                        <Marker position={{ lat: searchedPlace?.location.latitude || center.lat, lng: searchedPlace?.location.longitude || center.lng }} />
                        :
                        <></>
                }

            </GoogleMap>
        </div>
    )
}