"use client"

import { useState, useRef, useEffect } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { Tooltip } from "react-tooltip"
import { useTheme } from "next-themes"

interface WorldMapProps {
  countryData: Record<string, number>
  language: string
  onCountryClick?: (countryCode: string) => void
  activeCountry?: string
  countryNames?: Record<string, string>
  countryTotals?: Record<string, number>
  filteredCountryData?: Record<string, number>
  filters?: Record<string, any>
  t?: (key: string) => string
  geoJSON?: any
}

// Define color intervals for the legend
const colorIntervals = [
  { min: 0, max: 0, color: "#F5F4F6", label: "0" },
  { min: 1, max: 5, color: "#BBDEFB", label: "1-5" },
  { min: 6, max: 20, color: "#64B5F6", label: "6-20" },
  { min: 21, max: 50, color: "#2196F3", label: "21-50" },
  { min: 51, max: Number.POSITIVE_INFINITY, color: "#0D47A1", label: "51+" },
]

// Function to get color based on count
const getColorForCount = (count: number) => {
  for (const interval of colorIntervals) {
    if (count >= interval.min && count <= interval.max) {
      return interval.color
    }
  }
  return "#F5F4F6" // Default color
}

const WorldMap = ({
  countryData,
  language,
  onCountryClick,
  activeCountry,
  countryNames = {},
  countryTotals = {},
  filteredCountryData = {},
  filters = {},
  t = (key) => key,
  geoJSON = null,
}: WorldMapProps) => {
  const [tooltipContent, setTooltipContent] = useState("")
  const [isMapActive, setIsMapActive] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  // Handle clicks outside the map to deactivate it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mapRef.current && !mapRef.current.contains(event.target as Node)) {
        setIsMapActive(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Prevent wheel events when map is not active
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isMapActive && mapRef.current?.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    // Use passive: false to allow preventDefault
    document.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      document.removeEventListener("wheel", handleWheel)
    }
  }, [isMapActive])

  // Handle country click
  const handleCountryClick = (countryCode: string) => {
    if (isMapActive && onCountryClick) {
      onCountryClick(countryCode)
    }
  }

  return (
    <div
      ref={mapRef}
      className={`relative border rounded-lg p-2 ${
        isMapActive ? "cursor-grab" : "cursor-pointer"
      } ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
      onClick={() => !isMapActive && setIsMapActive(true)}
    >
      {!isMapActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg z-10">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-md shadow-md">
            {language === "en" ? "Click to activate map" : "Cliquez pour activer la carte"}
          </div>
        </div>
      )}

      <ComposableMap projection="geoMercator" style={{ width: "100%", height: "500px" }}>
        <ZoomableGroup
          zoom={1}
          center={[0, 0]}
          translateExtent={[
            [-100, -200],
            [1000, 600],
          ]}
        >
          <Geographies geography={geoJSON || "/world-countries.json"}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Handle different ID formats in different GeoJSON structures
                const id = geo.id || (geo.properties && geo.properties.ISO_A3)
                if (!id) {
                  return null
                }

                // Get country name directly from GeoJSON properties
                const name = geo.properties?.name || "Unknown"

                // Get counts
                const totalCount = countryTotals[id] || 0
                const isActive = activeCountry === id

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={
                      isActive
                        ? "#F53" // Highlight active country
                        : getColorForCount(totalCount)
                    }
                    stroke="#D6D6DA"
                    strokeWidth={0.5}
                    onClick={() => handleCountryClick(id)}
                    onMouseEnter={() => {
                      const filteredCount = filteredCountryData[id] || 0
                      const hasFilters = Object.keys(filters).length > 0

                      let tooltipText = `${name}: ${totalCount} ${language === "en" ? "entities" : "entités"}`

                      if (hasFilters && filters.country !== id && totalCount > 0) {
                        tooltipText += `\n${language === "en" ? "Filtered" : "Filtré"}: ${filteredCount}`
                      }

                      setTooltipContent(tooltipText)
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("")
                    }}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: isActive ? "#F53" : "#F86", cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                    data-tooltip-id="geo-tooltip"
                    className="cursor-pointer"
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md z-20">
        <div className="text-xs font-medium mb-1">
          {language === "en" ? "Entities per country" : "Entités par pays"}
        </div>
        {colorIntervals.map((interval, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4" style={{ backgroundColor: interval.color, border: "1px solid #D6D6DA" }}></div>
            <span>{interval.label}</span>
          </div>
        ))}
      </div>

      <Tooltip id="geo-tooltip" content={tooltipContent} />
    </div>
  )
}

export default WorldMap

