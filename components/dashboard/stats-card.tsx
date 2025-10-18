import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: string | number | ReactNode
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export default function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={`bg-gray-900/50 border-gray-800 card-hover ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? "text-green-400" : "text-red-400"}`}>
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last week
          </p>
        )}
      </CardContent>
    </Card>
  )
}
