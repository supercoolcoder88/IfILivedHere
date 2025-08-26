'use client'
import { useState } from "react"
import { GetPlaceDetailsResponse, PostAutocompleteResponse } from "../types/googlePlaces"
import { CommandEmpty, CommandInput } from "cmdk";
import { Command, CommandItem, CommandList } from "@/components/ui/command";

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

            console.log(data)
        } catch (error) {
            console.error("Failed to get place details", error)
        }
    }

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

            <button onClick={() => getPlaceDetails(selectedPlaceId)}>Search</button>
        </div>
    )
}