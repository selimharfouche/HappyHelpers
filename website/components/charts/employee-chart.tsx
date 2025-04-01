"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface EmployeeChartProps {
  data: Array<{ name: string; count: number }>
  language: string
  onRangeClick: (range: string) => void
  activeRange?: string
}

export function EmployeeChart({ data, language, onRangeClick, activeRange }: EmployeeChartProps) {
  // Memoize the sorted data to prevent unnecessary re-renders
  const sortedData = useMemo(() => {
    // Create a mapping for proper sorting
    const rangeOrder: Record<string, number> = {
      "1-50": 1,
      "51-200": 2,
      "201-500": 3,
      "501-1000": 4,
      "1001+": 5,
    }

    return [...data].sort((a, b) => {
      return (rangeOrder[a.name] || 99) - (rangeOrder[b.name] || 99)
    })
  }, [data])

  // Define colors
  const baseColor = "#4f46e5" // Indigo
  const activeColor = "#f43f5e" // Rose/pink for active state

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-sm">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">{`${language === "en" ? "Entities" : "Entités"}: ${payload[0].value}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>{language === "en" ? "Top Employee Ranges" : "Principales Plages d'Employés"}</CardTitle>
        <CardDescription>
          {language === "en"
            ? "Distribution of entities by employee range"
            : "Distribution des entités par nombre d'employés"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]" style={{ cursor: "pointer" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={sortedData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barCategoryGap={8}
              onMouseMove={(e) => (e.isTooltipActive = false)}
            >
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" scale="band" tick={{ fontSize: 12 }} width={80} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
              <Bar
                dataKey="count"
                //onClick={(data) => {
                  //console.log("Clicked on employee range:", data.name)
                  //onRangeClick(data.name)
                //}}
                cursor="pointer"
                animationDuration={300}
                style={{ cursor: "pointer" }}
                // Disable default hover effects
                isAnimationActive={false}
              >
                {sortedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === activeRange ? activeColor : baseColor}
                    style={{
                      transition: "fill 0.3s ease",
                    }}
                    className="hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

