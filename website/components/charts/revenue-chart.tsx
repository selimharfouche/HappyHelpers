"use client"

import { useRef, useEffect } from "react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

interface RevenueChartProps {
  data: Array<{ name: string; value: number }>
  language: string
  onRangeClick?: (range: string) => void
  activeRange?: string
}

export function RevenueChart({ data, language, onRangeClick, activeRange }: RevenueChartProps) {
  const chartRef = useRef<ChartJS>(null)

  // Handle click events on the chart
  useEffect(() => {
    const chart = chartRef.current

    if (!chart || !onRangeClick) return

    const handleClick = (event: MouseEvent) => {
      const points = chart.getElementsAtEventForMode(event, "nearest", { intersect: true }, false)

      if (points.length) {
        const firstPoint = points[0]
        const index = firstPoint.index
        const range = data[index].name

        // Call the click handler without any conditions
        onRangeClick(range)
      }
    }

    chart.canvas.addEventListener("click", handleClick)

    // Add cursor style to canvas
    if (chart.canvas) {
      chart.canvas.style.cursor = "pointer"
    }

    return () => {
      chart.canvas.removeEventListener("click", handleClick)
    }
  }, [data, onRangeClick])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
          cursor: "pointer",
        },
      },
      title: {
        display: true,
        text: language === "en" ? "Revenue Distribution" : "Distribution des Revenus",
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw
            const percentage = ((value / data.reduce((acc, item) => acc + item.value, 0)) * 100).toFixed(1)
            return `${context.label}: ${value} (${percentage}%)`
          },
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && onRangeClick) {
        const index = elements[0].index
        onRangeClick(data[index].name)
      }
    },
  }

  // Base colors
  const baseColors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
  ]

  // Highlight the active slice
  const backgroundColor = data.map((item, index) =>
    item.name === activeRange ? "#F53" : baseColors[index % baseColors.length],
  )

  const borderColor = data.map((item, index) =>
    item.name === activeRange ? "#E42" : baseColors[index % baseColors.length],
  )

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor,
        borderColor,
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm h-80" style={{ cursor: "pointer" }}>
      <Pie ref={chartRef} options={options as any} data={chartData} />
    </div>
  )
}

