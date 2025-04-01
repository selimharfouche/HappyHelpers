"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import WorldMap from "./world-map"
import LanguageSwitcher from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { IndustryChart } from "./charts/industry-chart"
import { RevenueChart } from "./charts/revenue-chart"
import { EmployeeChart } from "./charts/employee-chart"
import {
  fetchData,
  fetchGeoJSON,
  getCountryData,
  getTopIndustries,
  getRevenueRanges,
  getEmployeeRanges,
} from "@/lib/data-utils"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

// Define filter types
type FilterType = "country" | "industry" | "revenue" | "employee"

// Define filter interface
interface Filter {
  type: FilterType
  value: string
}

export default function WorldMapDashboard() {
  const [language, setLanguage] = useState<string>("en")
  const [entities, setEntities] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [countryMap, setCountryMap] = useState<Record<string, string>>({})
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [geoJSON, setGeoJSON] = useState<any>(null)

  // Ref for the charts section to scroll to
  const chartsRef = useRef<HTMLDivElement>(null)

  // Load data and country mapping
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      try {
        // Load entities data
        const data = await fetchData()
        setEntities(data)
        console.log(`Loaded ${data.length} entities`)

        // Load GeoJSON data
        const geo = await fetchGeoJSON()
        setGeoJSON(geo)
        console.log("GeoJSON loaded successfully")

        // Create country name mapping from GeoJSON
        const mapping: Record<string, string> = {}

        // Extract country names based on GeoJSON structure
        if (geo.type === "FeatureCollection" && Array.isArray(geo.features)) {
          // Standard GeoJSON
          geo.features.forEach((feature: any) => {
            if (feature && feature.id && feature.properties && feature.properties.name) {
              mapping[feature.id] = feature.properties.name
            }
          })
          console.log(`Extracted ${Object.keys(mapping).length} country names from GeoJSON`)
        } else if (geo.objects && geo.objects.countries && geo.objects.countries.geometries) {
          // TopoJSON format
          geo.objects.countries.geometries.forEach((geo: any) => {
            if (geo && geo.id && geo.properties && geo.properties.name) {
              mapping[geo.id] = geo.properties.name
            }
          })
          console.log(`Extracted ${Object.keys(mapping).length} country names from TopoJSON`)
        } else {
          console.warn("Unexpected GeoJSON structure, using fallback country names")
        }

        setCountryMap(mapping)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Helper function to normalize employee range for comparison
  const normalizeRange = (range: string): [number, number] => {
    if (range.includes("-")) {
      const parts = range.split("-")
      const min = Number.parseInt(parts[0], 10)
      const max = parts[1].includes("+") ? Number.MAX_SAFE_INTEGER : Number.parseInt(parts[1], 10)
      return [min, max]
    } else if (range.includes("+")) {
      const min = Number.parseInt(range.replace("+", ""), 10)
      return [min, Number.MAX_SAFE_INTEGER]
    } else {
      // Single number
      const num = Number.parseInt(range, 10)
      return [num, num]
    }
  }

  // Helper function to check if a range overlaps with another range
  const rangesOverlap = (range1: string, range2: string): boolean => {
    // Handle special cases
    if (range1 === range2) return true

    // Normalize ranges for comparison
    const [min1, max1] = normalizeRange(range1)
    const [min2, max2] = normalizeRange(range2)

    // Check for overlap
    return min1 <= max2 && min2 <= max1
  }

  // Toggle filter function
  const toggleFilter = (type: string, value: string) => {
    console.log(`Toggling filter: ${type} = ${value}`)

    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }

      // If it's a country filter, replace any existing country filter
      if (type === "country") {
        // If the same country is clicked again, remove the filter
        if (prevFilters.country === value) {
          delete newFilters.country
        } else {
          // Otherwise, set the new country filter
          newFilters.country = value
        }
      }
      // For other filter types
      else {
        // If the filter value already exists, remove it
        if (prevFilters[type] === value) {
          delete newFilters[type]
        } else {
          // Otherwise, set the new filter
          newFilters[type] = value
        }
      }

      console.log("New filters:", newFilters)
      return newFilters
    })
  }

  // Get filtered entities based on current filters
  const getFilteredEntities = () => {
    return entities.filter((entity) => {
      // Check each active filter
      for (const [type, value] of Object.entries(filters)) {
        if (type === "country" && entity.geography?.country_code !== value) {
          return false
        }

        if (type === "industry" && entity.organization?.industry !== value) {
          return false
        }

        if (type === "revenue" && entity.organization?.size?.revenue_range !== value) {
          return false
        }

        if (type === "employee") {
          // If entity doesn't have employee range data, filter it out
          if (!entity.organization?.size?.employees_range) {
            return false
          }

          const entityRange = entity.organization.size.employees_range

          // Use the helper function to check if ranges overlap
          if (!rangesOverlap(entityRange, value)) {
            return false
          }
        }
      }
      return true
    })
  }

  // Get total count for each country (unfiltered)
  const getCountryTotals = () => {
    const countryTotals: Record<string, number> = {}

    entities.forEach((entity) => {
      if (entity.geography?.country_code) {
        const countryCode = entity.geography.country_code
        countryTotals[countryCode] = (countryTotals[countryCode] || 0) + 1
      }
    })

    return countryTotals
  }

  // Get filtered counts for each country
  const getFilteredCountryData = () => {
    const filteredData: Record<string, number> = {}

    // Apply all filters EXCEPT country filter
    const tempFilters = { ...filters }
    delete tempFilters.country

    const filteredByOtherCriteria = entities.filter((entity) => {
      // Check each active filter except country
      for (const [type, value] of Object.entries(tempFilters)) {
        if (type === "industry" && entity.organization?.industry !== value) {
          return false
        }
        if (type === "revenue" && entity.organization?.size?.revenue_range !== value) {
          return false
        }
        if (type === "employee") {
          // If entity doesn't have employee range data, filter it out
          if (!entity.organization?.size?.employees_range) {
            return false
          }

          const entityRange = entity.organization.size.employees_range

          // Use the helper function to check if ranges overlap
          if (!rangesOverlap(entityRange, value)) {
            return false
          }
        }
      }
      return true
    })

    // Count entities per country after applying other filters
    filteredByOtherCriteria.forEach((entity) => {
      if (entity.geography?.country_code) {
        const countryCode = entity.geography.country_code
        filteredData[countryCode] = (filteredData[countryCode] || 0) + 1
      }
    })

    return filteredData
  }

  // Handle country click with scrolling
  const handleCountryClick = (countryCode: string) => {
    toggleFilter("country", countryCode)

    // Scroll to charts section
    setTimeout(() => {
      if (chartsRef.current) {
        chartsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 100)
  }

  // Compute derived data based on filtered entities
  const filteredEntities = useMemo(() => getFilteredEntities(), [entities, filters])

  // Update the countryData calculation to use the new functions
  const countryTotals = useMemo(() => getCountryTotals(), [entities])
  const filteredCountryData = useMemo(() => getFilteredCountryData(), [entities, filters])

  const countryData = useMemo(() => getCountryData(filteredEntities), [filteredEntities])
  const topIndustries = useMemo(() => getTopIndustries(filteredEntities), [filteredEntities])
  const revenueRanges = useMemo(() => getRevenueRanges(filteredEntities), [filteredEntities])
  const employeeRanges = useMemo(() => getEmployeeRanges(filteredEntities), [filteredEntities])
  const totalEntities = filteredEntities.length

  // Translation function
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        Total: "Total",
        Filtered: "Filtered",
        entities: "entities",
      },
      fr: {
        Total: "Total",
        Filtered: "Filtré",
        entities: "entités",
      },
    }

    return translations[language]?.[key] || key
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({})
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">{language === "en" ? "Loading data..." : "Chargement des données..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {language === "en" ? "Global Entity Dashboard" : "Tableau de Bord des Entités Mondiales"}
        </h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
          <ThemeToggle language={language} />
        </div>
      </div>

      {/* Active filters display */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">{language === "en" ? "Active Filters:" : "Filtres Actifs:"}</span>
          {Object.entries(filters).map(([type, value]) => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              <span>{type === "country" ? countryMap[value] || value : value}</span>
              <button
                onClick={() => toggleFilter(type, value)}
                className="ml-1 rounded-full hover:bg-muted p-1 cursor-pointer"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-sm text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer"
          >
            {language === "en" ? "Clear All" : "Effacer Tout"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="text-2xl font-bold">{totalEntities}</div>
          <div className="text-sm text-muted-foreground">
            {language === "en" ? "Total Entities" : "Total des Entités"}
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="text-2xl font-bold">{Object.keys(countryData).length}</div>
          <div className="text-sm text-muted-foreground">
            {language === "en" ? "Countries Affected" : "Pays Affectés"}
          </div>
        </div>
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="text-2xl font-bold">{topIndustries.length > 0 ? topIndustries[0].name : "-"}</div>
          <div className="text-sm text-muted-foreground">
            {language === "en" ? "Top Industry" : "Industrie Principale"}
          </div>
        </div>
      </div>

      <WorldMap
        countryData={countryData}
        language={language}
        onCountryClick={handleCountryClick}
        activeCountry={filters.country}
        countryNames={countryMap}
        countryTotals={countryTotals}
        filteredCountryData={filteredCountryData}
        filters={filters}
        t={t}
        geoJSON={geoJSON}
      />

      {/* Charts section with ref for scrolling */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <IndustryChart
          data={topIndustries}
          language={language}
          onIndustryClick={(industry) => toggleFilter("industry", industry)}
          activeIndustry={filters.industry}
        />
        <RevenueChart
          data={revenueRanges}
          language={language}
          onRangeClick={(range) => toggleFilter("revenue", range)}
          activeRange={filters.revenue}
        />
        <EmployeeChart
          data={employeeRanges}
          language={language}
          onRangeClick={(range) => {
            console.log("Employee range clicked:", range)
            toggleFilter("employee", range)
          }}
          activeRange={filters.employee}
        />
      </div>
    </div>
  )
}

