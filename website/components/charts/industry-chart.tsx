"use client"

import { useRef, useEffect } from "react"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface IndustryChartProps {
  data: Array<{ name: string; count: number }>
  language: string
  onIndustryClick?: (industry: string) => void
  activeIndustry?: string
}

export function IndustryChart({ data, language, onIndustryClick, activeIndustry }: IndustryChartProps) {
  const chartRef = useRef<ChartJS>(null)

  // Handle click events on the chart
  useEffect(() => {
    const chart = chartRef.current

    if (!chart || !onIndustryClick) return

    const handleClick = (event: MouseEvent) => {
      const points = chart.getElementsAtEventForMode(event, "nearest", { intersect: true }, false)

      if (points.length) {
        const firstPoint = points[0]
        const index = firstPoint.index
        const industry = data[index].name

        // Call the click handler without any conditions
        onIndustryClick(industry)
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
  }, [data, onIndustryClick])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: language === "en" ? "Top 5 Industries" : "Top 5 Industries",
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.raw} ${language === "en" ? "entities" : "entités"}`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0 && onIndustryClick) {
        const index = elements[0].index
        onIndustryClick(data[index].name)
      }
    },
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: data.map((item) => (item.name === activeIndustry ? "#F53" : "#3b82f6")),
        borderColor: data.map((item) => (item.name === activeIndustry ? "#E42" : "#2563eb")),
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm h-80">
      <Bar ref={chartRef} options={options as any} data={chartData} />
    </div>
  )
}

