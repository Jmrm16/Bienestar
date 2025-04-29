"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import { motion } from "framer-motion"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 273 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
  
  
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function Estado() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
      className="relative rounded-xl border border-indigo-500/30 p-4 overflow-hidden shadow-md   bg-card text-card-foreground"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Evaluación</h2>
          <p className="text-xs text-gray-400">Total de visitas últimos 6 meses</p>
        </div>
        <TrendingUp className="w-5 h-5 text-indigo-400" />
      </div>

      <div className="pt-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-[4/3] max-h-[220px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="month" tick={{ fontSize: 10 }} />
            <PolarGrid />
            <Radar
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.6}
              dot={{ r: 3, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </div>

      {/* Fondo decorativo degradado difuminado */}
      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-xl" />
    </motion.div>
  )
}
