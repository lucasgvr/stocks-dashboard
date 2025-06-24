"use client"

import { useState } from "react"
import { MoreVertical, Eye, Edit, Calculator, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { CalculatedPosition } from "@/lib/portfolio"
import { formatCurrency, formatNumber } from "@/lib/portfolio"
import { CorporateEventsDialog } from "./corporate-events-dialog"

interface PortfolioListViewProps {
  positions: CalculatedPosition[]
  onViewTransactions: (position: CalculatedPosition) => void
  onEditPrice: (position: CalculatedPosition) => void
  onCalculateFairPrice: (position: CalculatedPosition) => void
  useLocalStorage?: boolean
}

export function PortfolioListView({
  positions,
  onViewTransactions,
  onEditPrice,
  onCalculateFairPrice,
  useLocalStorage = false,
}: PortfolioListViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"symbol" | "invested" | "profit" | "yield">("invested")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [corporateEventsOpen, setCorporateEventsOpen] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState<string>("")

  // Filtrar posições
  const filteredPositions = positions.filter(
    (position) =>
      position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.company_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Ordenar posições
  const sortedPositions = [...filteredPositions].sort((a, b) => {
    let aValue: number
    let bValue: number

    switch (sortBy) {
      case "symbol":
        return sortOrder === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol)
      case "invested":
        aValue = Math.abs(a.total_invested)
        bValue = Math.abs(b.total_invested)
        break
      case "profit":
        aValue = a.profit_loss || 0
        bValue = b.profit_loss || 0
        break
      case "yield":
        aValue = a.dividend_yield
        bValue = b.dividend_yield
        break
      default:
        return 0
    }

    return sortOrder === "asc" ? aValue - bValue : bValue - aValue
  })

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
  }

  const getSafetyMarginColor = (margin: number) => {
    if (margin >= 20) return "text-green-600 dark:text-green-400"
    if (margin >= 0) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getSafetyMarginText = (margin: number) => {
    if (margin >= 20) return "Excelente"
    if (margin >= 0) return "Baixa"
    return "Sobrevalorizada"
  }

  const handleViewCorporateEvents = (symbol: string) => {
    setSelectedSymbol(symbol)
    setCorporateEventsOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-lg">Lista de Posições</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar por ticker ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "symbol" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("symbol")}
                >
                  Ticker {sortBy === "symbol" && (sortOrder === "asc" ? "↑" : "↓")}
                </Button>
                <Button
                  variant={sortBy === "invested" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("invested")}
                >
                  Investido {sortBy === "invested" && (sortOrder === "asc" ? "↑" : "↓")}
                </Button>
                <Button
                  variant={sortBy === "profit" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("profit")}
                >
                  Lucro {sortBy === "profit" && (sortOrder === "asc" ? "↑" : "↓")}
                </Button>
                <Button
                  variant={sortBy === "yield" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSort("yield")}
                >
                  Yield {sortBy === "yield" && (sortOrder === "asc" ? "↑" : "↓")}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Posições */}
      <div className="space-y-2">
        {sortedPositions.map((position) => {
          const hasCurrentPrice = position.current_price && position.current_price > 0
          const hasFairPrice = position.fair_price && position.fair_price > 0
          const isProfit = position.profit_loss && position.profit_loss > 0

          return (
            <Card
              key={position.symbol}
              className={`hover:shadow-md transition-all duration-200 ${
                position.is_sold_out ? "opacity-50 bg-muted/20" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Informações Básicas */}
                  <div className="flex items-center gap-3 lg:w-64">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 dark:from-blue-400 dark:to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        position.is_sold_out ? "opacity-60" : ""
                      }`}
                    >
                      {position.symbol.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{position.symbol}</h3>
                        {position.is_sold_out && (
                          <Badge variant="secondary" className="text-xs">
                            Vendida
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{position.company_name}</p>
                    </div>
                  </div>

                  {/* Métricas Principais */}
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
                    {/* Quantidade e Preço Médio */}
                    <div>
                      <div className="text-muted-foreground">Quantidade</div>
                      <div className="font-semibold">
                        {position.is_sold_out
                          ? `0 (${formatNumber(Math.abs(position.total_shares))})`
                          : formatNumber(position.total_shares)}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Preço Médio</div>
                      <div className="font-semibold">{formatCurrency(position.average_price)}</div>
                    </div>

                    {/* Valor Investido */}
                    <div>
                      <div className="text-muted-foreground">
                        {position.is_sold_out ? "Foi Investido" : "Investido"}
                      </div>
                      <div className="font-semibold">{formatCurrency(Math.abs(position.total_invested))}</div>
                    </div>

                    {/* Valor Atual / Lucro */}
                    {!position.is_sold_out && hasCurrentPrice ? (
                      <>
                        <div>
                          <div className="text-muted-foreground">Valor Atual</div>
                          <div className="font-semibold">{formatCurrency(position.current_value!)}</div>
                        </div>

                        <div>
                          <div className="text-muted-foreground">Lucro/Prejuízo</div>
                          <div
                            className={`font-semibold ${isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {isProfit ? "+" : ""}
                            {formatCurrency(position.profit_loss!)}
                          </div>
                          <div
                            className={`text-xs ${isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {isProfit ? "+" : ""}
                            {position.profit_loss_percent!.toFixed(2)}%
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-muted-foreground">Preço Atual</div>
                          <div className="text-sm text-muted-foreground">
                            {hasCurrentPrice ? formatCurrency(position.current_price!) : "Não definido"}
                          </div>
                        </div>
                        <div></div>
                      </>
                    )}

                    {/* Dividendos */}
                    <div>
                      <div className="text-muted-foreground">Dividendos 12m</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(position.dividends_received_12m)}
                      </div>
                      <div className="text-xs text-muted-foreground">Yield: {position.dividend_yield.toFixed(2)}%</div>
                    </div>
                  </div>

                  {/* Preços e Margem de Segurança */}
                  {!position.is_sold_out && (hasCurrentPrice || hasFairPrice) && (
                    <div className="lg:w-48 space-y-2">
                      {hasCurrentPrice && (
                        <div className="flex justify-between text-xs bg-blue-50 dark:bg-blue-950/50 p-2 rounded">
                          <span>Atual:</span>
                          <span className="font-semibold">{formatCurrency(position.current_price!)}</span>
                        </div>
                      )}

                      {hasFairPrice && (
                        <div className="flex justify-between text-xs bg-purple-50 dark:bg-purple-950/50 p-2 rounded">
                          <span>Justo:</span>
                          <span className="font-semibold">{formatCurrency(position.fair_price!)}</span>
                        </div>
                      )}

                      {hasCurrentPrice && hasFairPrice && position.safety_margin !== undefined && (
                        <div
                          className={`text-xs p-2 rounded ${getSafetyMarginColor(position.safety_margin)} bg-opacity-10`}
                        >
                          <div className="flex justify-between">
                            <span>Margem:</span>
                            <span className="font-semibold">
                              {position.safety_margin >= 0 ? "+" : ""}
                              {position.safety_margin.toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-center mt-1">{getSafetyMarginText(position.safety_margin)}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {position.transactions.length} transaç{position.transactions.length !== 1 ? "ões" : "ão"}
                    </div>

                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onViewTransactions(position)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Transações
                        </DropdownMenuItem>
                        {!position.is_sold_out && (
                          <>
                            <DropdownMenuItem onClick={() => onEditPrice(position)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Definir Preço Atual
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCalculateFairPrice(position)}>
                              <Calculator className="h-4 w-4 mr-2" />
                              Calcular Preço Justo
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleViewCorporateEvents(position.symbol)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Eventos Corporativos
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {sortedPositions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhuma posição encontrada para a busca." : "Nenhuma posição encontrada."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <CorporateEventsDialog
        symbol={selectedSymbol}
        open={corporateEventsOpen}
        onOpenChange={setCorporateEventsOpen}
        useLocalStorage={useLocalStorage}
      />
    </div>
  )
}
