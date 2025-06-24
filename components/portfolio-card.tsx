"use client"

import type React from "react"
import { useState } from "react"

import { MoreVertical, Eye, Edit, Calculator, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { CalculatedPosition } from "@/lib/portfolio"
import { formatCurrency, formatNumber } from "@/lib/portfolio"
// Adicionar import do novo dialog
import { CorporateEventsDialog } from "./corporate-events-dialog"

interface PortfolioCardProps {
  position: CalculatedPosition
  onViewTransactions: (position: CalculatedPosition) => void
  onEditPrice: (position: CalculatedPosition) => void
  onCalculateFairPrice: (position: CalculatedPosition) => void
  useLocalStorage?: boolean
}

export function PortfolioCard({
  position,
  onViewTransactions,
  onEditPrice,
  onCalculateFairPrice,
  useLocalStorage = false,
}: PortfolioCardProps) {
  const hasCurrentPrice = position.current_price && position.current_price > 0
  const hasFairPrice = position.fair_price && position.fair_price > 0
  const isProfit = position.profit_loss && position.profit_loss > 0

  // Adicionar estado para o dialog de eventos
  const [corporateEventsOpen, setCorporateEventsOpen] = useState(false)

  const handleViewTransactions = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onViewTransactions(position)
  }

  const handleEditPrice = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEditPrice(position)
  }

  const handleCalculateFairPrice = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCalculateFairPrice(position)
  }

  // Adicionar função para abrir eventos corporativos
  const handleViewCorporateEvents = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Abrindo eventos corporativos para:", position.symbol)
    setCorporateEventsOpen(true)
  }

  const getSafetyMarginColor = (margin: number) => {
    if (margin >= 20) return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50"
    if (margin >= 0) return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/50"
    return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50"
  }

  const getSafetyMarginText = (margin: number) => {
    if (margin >= 20) return "Excelente"
    if (margin >= 0) return "Baixa"
    return "Sobrevalorizada"
  }

  return (
    <>
      <Card
        className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border ${
          position.is_sold_out ? "opacity-50 bg-muted/20" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 dark:from-blue-400 dark:to-green-400 rounded-full flex items-center justify-center text-white font-bold ${
                  position.is_sold_out ? "opacity-60" : ""
                }`}
              >
                {position.symbol.substring(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{position.symbol}</CardTitle>
                  {position.is_sold_out && (
                    <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                      Vendida
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs line-clamp-1">{position.company_name}</CardDescription>
              </div>
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleViewTransactions}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Transações
                </DropdownMenuItem>
                {!position.is_sold_out && (
                  <>
                    <DropdownMenuItem onClick={handleEditPrice}>
                      <Edit className="h-4 w-4 mr-2" />
                      Definir Preço Atual
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCalculateFairPrice}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calcular Preço Justo
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={handleViewCorporateEvents}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Eventos Corporativos
                  {position.corporate_events && position.corporate_events.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {position.corporate_events.length}
                    </Badge>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valor Investido */}
          <div>
            <div className="text-2xl font-bold">
              {position.is_sold_out
                ? formatCurrency(Math.abs(position.total_invested))
                : formatCurrency(position.total_invested)}
            </div>
            <div className="text-sm text-muted-foreground">
              {position.is_sold_out ? "Valor que Foi Investido" : "Valor Investido"}
            </div>
          </div>

          {/* Valor Atual e Lucro/Prejuízo (apenas para posições ativas) */}
          {!position.is_sold_out && hasCurrentPrice && (
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-lg font-bold">{formatCurrency(position.current_value!)}</div>
                  <div className="text-sm text-muted-foreground">Valor Atual</div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {isProfit ? "+" : ""}
                    {formatCurrency(position.profit_loss!)}
                  </div>
                  <div
                    className={`text-sm ${isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {isProfit ? "+" : ""}
                    {position.profit_loss_percent!.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preços */}
          {!position.is_sold_out && (hasCurrentPrice || hasFairPrice) && (
            <div className="space-y-2">
              {hasCurrentPrice && (
                <div className="flex items-center justify-between text-sm bg-blue-50 dark:bg-blue-950/50 p-2 rounded">
                  <span className="text-muted-foreground">Preço Atual:</span>
                  <span className="font-semibold">{formatCurrency(position.current_price!)}</span>
                </div>
              )}

              {hasFairPrice && (
                <div className="flex items-center justify-between text-sm bg-purple-50 dark:bg-purple-950/50 p-2 rounded">
                  <span className="text-muted-foreground">Preço Justo:</span>
                  <span className="font-semibold">{formatCurrency(position.fair_price!)}</span>
                </div>
              )}

              {/* Margem de Segurança */}
              {hasCurrentPrice && hasFairPrice && position.safety_margin !== undefined && (
                <div className={`text-sm p-2 rounded ${getSafetyMarginColor(position.safety_margin)}`}>
                  <div className="flex items-center justify-between">
                    <span>Margem de Segurança:</span>
                    <span className="font-semibold">
                      {position.safety_margin >= 0 ? "+" : ""}
                      {position.safety_margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs mt-1">{getSafetyMarginText(position.safety_margin)}</div>
                </div>
              )}
            </div>
          )}

          {/* Métricas da Posição */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Quantidade</div>
              <div className="font-semibold">
                {position.is_sold_out
                  ? `0 ações (tinha ${formatNumber(Math.abs(position.total_shares))})`
                  : `${formatNumber(position.total_shares)} ações`}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Preço Médio</div>
              <div className="font-semibold">{formatCurrency(position.average_price)}</div>
            </div>
          </div>

          {/* Dividendos */}
          {position.dividends_received_12m > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Dividendos 12m</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(position.dividends_received_12m)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Dividend Yield</div>
                  <div className="font-semibold">{position.dividend_yield.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Número de Transações */}
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {position.transactions.length} transação{position.transactions.length !== 1 ? "ões" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Eventos Corporativos */}
      <CorporateEventsDialog
        symbol={position.symbol}
        open={corporateEventsOpen}
        onOpenChange={setCorporateEventsOpen}
        useLocalStorage={useLocalStorage}
      />
    </>
  )
}
