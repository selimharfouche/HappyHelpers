"use client"

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export function EnhancedBarChart({ data, index, categories, colors, valueFormatter, yAxisWidth = 120 }) {
  // Generate colors with varying opacity based on value
  const getBarColor = (value) => {
    // Find the maximum value for scaling
    const maxValue = Math.max(...data.map(item => item.value));
    const opacity = 0.5 + (value / maxValue) * 0.5; // Scale opacity between 0.5-1 based on max value
    return `hsl(var(--chart-1) / ${opacity})`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-2 shadow-md text-sm">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-primary">{valueFormatter ? valueFormatter(payload[0].value) : payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border) / 0.5)" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => valueFormatter ? valueFormatter(value).replace(' incidents', '') : value} 
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis 
            type="category" 
            dataKey={index}
            width={yAxisWidth}
            tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={categories[0]} radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}