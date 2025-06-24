"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { StockQuote } from "@/lib/api"

interface StockCardProps {
  stock: StockQuote
}

const stockLogos: Record<string, string> = {
  VALE3: "🏔️",
  ITUB4: "🏦",
  BBAS3: "🏛️",
  PETR4: "⛽",
  MGLU3: "🛒",
  ABEV3: "🍺",
  WEGE3: "⚡",
  RENT3: "🚗",
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const formatLargeNumber = (value: number) => {
  if (value >= 1000000000) {
    return `R$ ${(value / 1000000000).toFixed(1)}bi`
  } else if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}mi`
  }
  return formatCurrency(value)
}

export function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{stockLogos[stock.symbol] || "📈"}</span>
            <div>
              <CardTitle className="text-lg">{stock.symbol}</CardTitle>
              <CardDescription className="text-xs line-clamp-1">{stock.name}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {stock.sector}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{formatCurrency(stock.price)}</div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? "+" : ""}
              {formatCurrency(stock.change)} ({isPositive ? "+" : ""}
              {stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Volume</div>
            <div className="font-semibold">{stock.volume ? (stock.volume / 1000000).toFixed(1) + "M" : "N/A"}</div>
          </div>
          <div>
            <div className="text-gray-500">Market Cap</div>
            <div className="font-semibold">{stock.marketCap ? formatLargeNumber(stock.marketCap) : "N/A"}</div>
          </div>
          <div>
            <div className="text-gray-500">P/L</div>
            <div className="font-semibold">{stock.pe ? stock.pe.toFixed(1) : "N/A"}</div>
          </div>
          <div>
            <div className="text-gray-500">Div. Yield</div>
            <div className="font-semibold">{stock.dividendYield ? stock.dividendYield.toFixed(1) + "%" : "N/A"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
