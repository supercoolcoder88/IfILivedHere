'use client'
import { useEffect, useState } from "react"
import { NearbyPlace, NearbyPlacesState, PostAutocompleteResponse } from "../types/googlePlaces"
import { CommandEmpty, CommandInput } from "cmdk";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import GoogleMap from "../../components/GoogleMap/GoogleMap";
import { useNearbySearch } from "@/hooks/useNearbySearch";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Preahvihear } from "next/font/google";

interface PlaceSuggestions {
    placeId: string;
    address: string
}

export default function SearchPage() {
    // TODO: Move placeId to a zustand store
    const [selectedPlaceId, setSelectedPlaceId] = useState("")
    const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestions[]>([])
    const [searchText, setSearchText] = useState("")
    const [searchRadius, setSearchRadius] = useState("")
    const [nearbyPlaceMarkers, setNearbyPlaceMarkers] = useState<NearbyPlacesState>({
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

    const updateNearbyPlaceMarker = (key: string, places: NearbyPlace[], isOpenCheck: string) => {
        setNearbyPlaceMarkers(prev => (
            {
                ...prev,
                [key]: key === isOpenCheck ? places : []
            }
        ))
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
                    onClick={() => searchPlaceInformation(selectedPlaceId, parseFloat(searchRadius))}
                    disabled={!selectedPlaceId}
                >
                    Search
                </Button>
            </div>

            <Label htmlFor="radius">Radius</Label>
            <Input
                id="radius"
                type="number"
                value={searchRadius}
                onChange={(e) => {
                    const n = e.target.value.replace(/\D/g, "")
                    if (Number.isNaN(parseFloat(n))) {
                        setSearchRadius("0")
                    } else {
                        setSearchRadius(n)
                    }
                }}
                onBlur={(e) => {
                    const n = Number(e.target.value)
                    if (!Number.isNaN(n)) {
                        setSearchRadius(Math.min(50000, Math.max(1, n)).toString())
                    }
                }}
                onKeyDown={(e) => {
                    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault()
                }}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Radius (m)"
                min={1}
                max={50000}
                step={100}
                className="w-40"
            />
            {/* Nearby Results */}
            {nearbySearchApiState === "done" && (
                <div className="rounded-xl border shadow-sm p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(nearbyPlaces).map(([key, places]) => (
                            <div key={key} className="rounded-lg border p-3">
                                <Accordion type="single" collapsible onValueChange={(val) => updateNearbyPlaceMarker(key, places, val)}>
                                    <AccordionItem value={key}>
                                        <AccordionTrigger name={key} className="capitalize">
                                            {key.replace(/_/g, " ")} ({places.length <= 10 ? places.length : "10+"})
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="space-y-1">
                                                {places.map((place: NearbyPlace) => (
                                                    <li key={place.id} className="text-sm">
                                                        {place.displayName.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Map */}
            <div className="h-[400px] w-full rounded-xl border shadow-sm">
                <GoogleMap searchedPlace={searchedPlace} nearbyPlaces={nearbyPlaceMarkers} />
            </div>
        </div>
    )
}