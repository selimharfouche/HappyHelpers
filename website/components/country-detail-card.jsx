"use client"

import { useState } from "react"
import { useTranslation } from "@/utils/translation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { MapPin, Shield, X, ChevronDown, ChevronUp } from "lucide-react"

export function CountryDetailCard({ country, countryStats, onClose }) {
  const { t } = useTranslation()
  const [showAllCities, setShowAllCities] = useState(false)

  // Toggle showing all cities
  const toggleAllCities = () => {
    setShowAllCities(!showAllCities)
  }

  // No data check
  if (!country || !countryStats || !countryStats[country]) {
    return null;
  }

  const countryData = countryStats[country];
  const { count, cities, name = country } = countryData;

  // Format city data for display
  const allCityEntries = Object.entries(cities || {})
    .sort(([, a], [, b]) => b - a)
    .map(([city, count]) => ({ city, count }));
    
  // Display 5 cities by default, or all if expanded
  const cityEntries = showAllCities 
    ? allCityEntries 
    : allCityEntries.slice(0, 5);

  return (
    <Card className="rounded-lg border shadow-md overflow-hidden animate-in fade-in duration-1000">
      <CardHeader className="relative pb-2 bg-muted/20">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            {name}
          </CardTitle>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            aria-label={t("close_country_details")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CardDescription className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary/80" />
          <span>{t("ransomware_incidents_recorded", {count})}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {cityEntries.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary/80" />
              <span>{t("top_cities")}</span>
            </h3>
            <table className="w-full mb-2">
              <tbody>
                {cityEntries.map(({ city, count }, index) => (
                  <tr key={city} className="border-b last:border-b-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {index + 1}
                        </div>
                        <span className="font-medium">{city}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm text-muted-foreground whitespace-nowrap">
                      {count} {t(count === 1 ? "incident" : "incidents")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {allCityEntries.length > 5 && (
              <button 
                onClick={toggleAllCities}
                className="w-full text-center py-2 text-sm text-primary hover:underline flex items-center justify-center gap-1"
              >
                {showAllCities ? (
                  <>
                    <span>{t("show_fewer_cities")}</span>
                    <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span>{t("more_cities", {count: allCityEntries.length - 5})}</span>
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t("no_city_data")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}