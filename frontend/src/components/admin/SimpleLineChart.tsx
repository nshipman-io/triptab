import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DataPoint {
  date: string
  count: number
}

interface SimpleLineChartProps {
  title: string
  data: DataPoint[]
  color?: string
  emptyMessage?: string
}

export function SimpleLineChart({
  title,
  data,
  color = '#2D4739',
  emptyMessage = 'No data available',
}: SimpleLineChartProps) {
  // Format date for display (show month/day)
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-ink-light">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" />
              <XAxis
                dataKey="displayDate"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF9F6',
                  border: '1px solid #E5E2DB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#1F2937' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
