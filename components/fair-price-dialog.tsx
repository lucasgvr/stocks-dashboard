"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calculator } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CalculatedPosition } from "@/lib/portfolio"
import { formatCurrency } from "@/lib/portfolio"
import { saveFairPrice } from "@/lib/supabase"
import { saveFairPriceLocal } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface FairPriceDialogProps {
  position: CalculatedPosition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFairPriceUpdate: () => void
  useLocalStorage: boolean
}

interface DividendYear {
  year: number
  dividend: string
}

export function FairPriceDialog({
  position,
  open,
  onOpenChange,
  onFairPriceUpdate,
  useLocalStorage,
}: FairPriceDialogProps) {
  const [years, setYears] = useState("5")
  const [dividendYears, setDividendYears] = useState<DividendYear[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Inicializar anos de dividendos quando o número de anos muda
  useEffect(() => {
    if (open && years) {
      const numYears = Number.parseInt(years)
      if (numYears > 0 && numYears <= 20) {
        const currentYear = new Date().getFullYear()
        const newDividendYears: DividendYear[] = []

        for (let i = 0; i < numYears; i++) {
          newDividendYears.push({
            year: currentYear - i,
            dividend: "",
          })
        }

        setDividendYears(newDividendYears)
      }
    }
  }, [years, open])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setYears("5")
      setDividendYears([])
      setLoading(false)
    }
  }, [open])

  if (!position) return null

  const handleYearsChange = (value: string) => {
    const numYears = Number.parseInt(value)
    if (numYears >= 1 && numYears <= 20) {
      setYears(value)
    }
  }

  const handleDividendChange = (index: number, value: string) => {
    const newDividendYears = [...dividendYears]
    newDividendYears[index].dividend = value
    setDividendYears(newDividendYears)
  }

  const calculateFairPrice = () => {
    const validDividends = dividendYears.map((dy) => Number.parseFloat(dy.dividend)).filter((d) => !isNaN(d) && d >= 0)

    if (validDividends.length === 0) return 0

    const averageDividend = validDividends.reduce((sum, d) => sum + d, 0) / validDividends.length
    const fairPrice = averageDividend / 0.06 // Dividido por 6%

    return fairPrice
  }

  const calculateSafetyMargin = (fairPrice: number, currentPrice: number) => {
    if (currentPrice <= 0 || fairPrice <= 0) return 0
    return ((fairPrice - currentPrice) / fairPrice) * 100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validDividends = dividendYears.map((dy) => Number.parseFloat(dy.dividend)).filter((d) => !isNaN(d) && d >= 0)

    if (validDividends.length === 0) {
      toast({
        title: "Erro",
        description: "Informe pelo menos um dividendo válido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const averageDividend = validDividends.reduce((sum, d) => sum + d, 0) / validDividends.length
      const fairPrice = averageDividend / 0.06

      const fairPriceData = {
        symbol: position.symbol,
        fair_price: fairPrice,
        years_analyzed: Number.parseInt(years),
        average_dividend: averageDividend,
        dividend_data: dividendYears.reduce(
          (acc, dy) => {
            if (dy.dividend && !isNaN(Number.parseFloat(dy.dividend))) {
              acc[dy.year] = Number.parseFloat(dy.dividend)
            }
            return acc
          },
          {} as Record<number, number>,
        ),
      }

      if (useLocalStorage) {
        saveFairPriceLocal(fairPriceData)
      } else {
        await saveFairPrice(fairPriceData)
      }

      toast({
        title: "Sucesso",
        description: `Preço justo de ${position.symbol} calculado e salvo: ${formatCurrency(fairPrice)}`,
      })

      onFairPriceUpdate()
    } catch (error) {
      console.error("Erro ao salvar preço justo:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar preço justo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fairPrice = calculateFairPrice()
  const currentPrice = position.current_price || 0
  const safetyMargin = calculateSafetyMargin(fairPrice, currentPrice)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcular Preço Justo - {position.symbol}
          </DialogTitle>
          <DialogDescription>
            {position.company_name}
            <br />
            <span className="text-sm text-gray-500">
              Cálculo baseado na média de dividendos ÷ 6% (taxa de desconto)
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="years">Quantidade de Anos para Análise *</Label>
            <Input
              id="years"
              type="number"
              min="1"
              max="20"
              placeholder="Ex: 5"
              value={years}
              onChange={(e) => handleYearsChange(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">Entre 1 e 20 anos</p>
          </div>

          {dividendYears.length > 0 && (
            <div className="space-y-3">
              <Label>Dividendos por Ano (R$)</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dividendYears.map((dividendYear, index) => (
                  <div key={dividendYear.year} className="flex items-center gap-2">
                    <Label className="w-16 text-sm">{dividendYear.year}:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={dividendYear.dividend}
                      onChange={(e) => handleDividendChange(index, e.target.value)}
                      disabled={loading}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview dos Cálculos */}
          {fairPrice > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resultado do Cálculo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Média de Dividendos</div>
                    <div className="font-semibold">
                      {formatCurrency(
                        dividendYears
                          .map((dy) => Number.parseFloat(dy.dividend))
                          .filter((d) => !isNaN(d) && d >= 0)
                          .reduce((sum, d) => sum + d, 0) /
                          Math.max(
                            1,
                            dividendYears.filter((dy) => dy.dividend && !isNaN(Number.parseFloat(dy.dividend))).length,
                          ),
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Taxa de Desconto</div>
                    <div className="font-semibold">6,00%</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Preço Justo Calculado:</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{formatCurrency(fairPrice)}</div>
                    </div>
                  </div>
                </div>

                {currentPrice > 0 && (
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Preço Atual</div>
                        <div className="font-semibold">{formatCurrency(currentPrice)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Margem de Segurança</div>
                        <div className={`font-semibold ${safetyMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {safetyMargin >= 0 ? "+" : ""}
                          {safetyMargin.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 p-2 rounded text-xs">
                      {safetyMargin >= 20 ? (
                        <div className="text-green-700 bg-green-50 p-2 rounded">
                          ✅ Excelente margem de segurança! Ação pode estar subvalorizada.
                        </div>
                      ) : safetyMargin >= 0 ? (
                        <div className="text-yellow-700 bg-yellow-50 p-2 rounded">
                          ⚠️ Margem de segurança baixa. Considere aguardar melhor preço.
                        </div>
                      ) : (
                        <div className="text-red-700 bg-red-50 p-2 rounded">
                          ❌ Ação pode estar sobrevalorizada em relação ao preço justo.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || fairPrice <= 0} className="flex-1">
              {loading ? "Salvando..." : "Salvar Preço Justo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
