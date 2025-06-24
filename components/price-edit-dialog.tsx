"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import type { CalculatedPosition } from "@/lib/portfolio"
import { formatCurrency, updatePositionPrice } from "@/lib/portfolio"
import { saveStockPrice } from "@/lib/supabase"
import { saveStockPriceLocal } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

interface PriceEditDialogProps {
  position: CalculatedPosition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPriceUpdate: () => void
  useLocalStorage: boolean
}

export function PriceEditDialog({
  position,
  open,
  onOpenChange,
  onPriceUpdate,
  useLocalStorage,
}: PriceEditDialogProps) {
  const [currentPrice, setCurrentPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && position) {
      setCurrentPrice(position.current_price?.toString() || "")
    }
    if (!open) {
      setCurrentPrice("")
      setLoading(false)
    }
  }, [open, position])

  if (!position) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const price = Number(currentPrice)
    if (price <= 0) {
      toast({
        title: "Erro",
        description: "Preço deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (useLocalStorage) {
        saveStockPriceLocal(position.symbol, price)
      } else {
        await saveStockPrice(position.symbol, price)
      }

      toast({
        title: "Sucesso",
        description: `Preço de ${position.symbol} salvo com sucesso!`,
      })

      onPriceUpdate()
    } catch (error) {
      console.error("Erro ao atualizar preço:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar preço. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCurrentPrice("")
    setLoading(false)
    onOpenChange(false)
  }

  const previewPrice = Number(currentPrice) || 0
  const previewPosition = previewPrice > 0 ? updatePositionPrice(position, previewPrice) : position

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Definir Preço Atual - {position.symbol}
          </DialogTitle>
          <DialogDescription>{position.company_name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_price">Preço Atual (R$) *</Label>
            <Input
              id="current_price"
              type="number"
              step="0.01"
              placeholder="Ex: 32.50"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Preview dos Cálculos */}
          {previewPrice > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Preview dos Cálculos:</h4>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Preço Médio</div>
                    <div className="font-semibold">{formatCurrency(position.average_price)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Preço Atual</div>
                    <div className="font-semibold">{formatCurrency(previewPrice)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Valor Investido</div>
                    <div className="font-semibold">{formatCurrency(position.total_invested)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Valor Atual</div>
                    <div className="font-semibold">{formatCurrency(previewPosition.current_value!)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Lucro/Prejuízo:</span>
                    <div className="text-right">
                      <div
                        className={`font-bold ${previewPosition.profit_loss! >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {previewPosition.profit_loss! >= 0 ? "+" : ""}
                        {formatCurrency(previewPosition.profit_loss!)}
                      </div>
                      <div
                        className={`text-sm ${previewPosition.profit_loss! >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {previewPosition.profit_loss! >= 0 ? "+" : ""}
                        {previewPosition.profit_loss_percent!.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
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
            <Button type="submit" disabled={loading || previewPrice <= 0} className="flex-1">
              {loading ? "Salvando..." : "Salvar Preço"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
