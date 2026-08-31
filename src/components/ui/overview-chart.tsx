"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface OverviewChartProps {
    data: {
        name: string
        sales: number
        expenses: number
    }[]
}

export function OverviewChart({ data }: OverviewChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: any) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                    dataKey="sales"
                    fill="#22c55e" // Success color (Green)
                    radius={[4, 4, 0, 0]}
                    name="Ventes"
                />
                <Bar
                    dataKey="expenses"
                    fill="#ef4444" // Destructive color (Red)
                    radius={[4, 4, 0, 0]}
                    name="Dépenses"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
