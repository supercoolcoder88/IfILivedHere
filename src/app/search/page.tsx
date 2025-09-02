'use client'
import { useEffect, useState } from "react"
import { PostAutocompleteResponse } from "../types/googlePlaces"
import { CommandEmpty, CommandInput } from "cmdk";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import GoogleMap from "../../components/GoogleMap/GoogleMap";
import { useNearbySearch } from "@/hooks/useNearbySearch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface PlaceSuggestions {
    placeId: string;
    address: string
}

export default function SearchPage() {
    // TODO: Move placeId to a zustand store
    const [selectedPlaceId, setSelectedPlaceId] = useState("")
    const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestions[]>([])
    const [searchText, setSearchText] = useState("")

    const { searchedPlace, nearbyPlaces, searchPlaceInformation, nearbySearchApiState } = useNearbySearch()

    const autocompleteTextSearch = async (input: string) => {
        // Autocomplete usage restrictions
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
                .slice(0, 3)
                .map(s => ({
                    placeId: s.placePrediction.placeId,
                    address: s.placePrediction.text.text
                }))
            setPlaceSuggestions(fetchedSuggestions)
        } catch (error) {
            console.error("Failed to get suggestions", error)
        }
    }

    const handleAutocompleteSelection = (address: string, placeId: string) => {
        setSearchText(address)
        setSelectedPlaceId(placeId)
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Search Row */}
            <div className="flex w-full items-center gap-2">
                <Command className="flex-1 rounded-xl border shadow-sm">
                    <CommandInput
                        value={searchText}
                        onValueChange={(value) => {
                            setSearchText(value)
                            autocompleteTextSearch(value)
                        }}
                        placeholder="Search for a place"
                    />
                    {placeSuggestions && (
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            {placeSuggestions.map((suggestion) => (
                                <CommandItem
                                    key={suggestion.placeId}
                                    onSelect={() =>
                                        handleAutocompleteSelection(suggestion.address, suggestion.placeId)
                                    }
                                >
                                    {suggestion.address}
                                </CommandItem>
                            ))}
                        </CommandList>
                    )}
                </Command>
                <Button
                    onClick={() => searchPlaceInformation(selectedPlaceId)}
                    disabled={!selectedPlaceId}
                >
                    Search
                </Button>
            </div>

            {/* Nearby Results */}
            {nearbySearchApiState === "done" && (
                <div className="rounded-xl border shadow-sm">
                    <Table>
                        <TableBody>
                            {Object.entries(nearbyPlaces).map(([key, places]) => (
                                <TableRow key={key}>
                                    <TableCell className="font-medium capitalize">
                                        {key.replace(/_/g, " ")}
                                    </TableCell>
                                    <TableCell>
                                        {places.length <= 10 ? places.length : "10+"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Map */}
            <div className="h-[400px] w-full rounded-xl border shadow-sm">
                <GoogleMap searchedPlace={searchedPlace} />
            </div>
        </div>
    )
}