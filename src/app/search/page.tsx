'use client'
import { useState } from "react"

export default function SearchPage() {
    const [placeId, setPlaceId] = useState("")
    const placeDetailsUrl = new URL("https://places.googleapis.com/v1/places/" + placeId)
    placeDetailsUrl.searchParams.append("key", process.env.GOOGLE_API_KEY || "")

    return (
        <h1>Search page</h1>
    )
}