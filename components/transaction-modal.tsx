"use client"

import type React from "react"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { createTransaction } from "@/lib/supabase"
import { createTransactionLocal } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { getCurrentDateString, isValidDateString } from "@/lib/date-utils"

interface TransactionModalProps {
  onTransactionAdded: () => void
  useLocalStorage: boolean
}

export function TransactionModal({ onTransactionAdded, useLocalStorage }: TransactionModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    symbol: "",
    company_name: "",
    type: "buy" as "buy" | "sell" | "dividend",
    quantity: "",
    price: "",
    date: getCurrentDateString(), // Usar nossa função personalizada
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.symbol || !formData.company_name || !formData.type || !formData.price || !formData.date) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      // Validar formato da data
      if (!isValidDateString(formData.date)) {
        toast({
          title: "Erro",
          description: "Data inválida. Use o formato correto.",
          variant: "destructive",
        })
        return
      }

      const quantity = formData.type === "dividend" ? 0 : Number(formData.quantity)
      const price = Number(formData.price)
      const total = formData.type === "dividend" ? price : quantity * price

      if (formData.type !== "dividend" && quantity <= 0) {
        toast({
          title: "Erro",
          description: "Quantidade deve ser maior que zero",
          variant: "destructive",
        })
        return
      }

      if (price <= 0) {
        toast({
          title: "Erro",
          description: "Preço deve ser maior que zero",
          variant: "destructive",
        })
        return
      }

      const transactionData = {
        symbol: formData.symbol.toUpperCase(),
        company_name: formData.company_name,
        type: formData.type,
        quantity,
        price,
        total,
        date: formData.date, // Usar exatamente como está
      }

      console.log("🔍 Dados da transação sendo salvos:", transactionData)

      if (useLocalStorage) {
        createTransactionLocal(transactionData)
      } else {
        await createTransaction(transactionData)
      }

      // Reset form
      setFormData({
        symbol: "",
        company_name: "",
        type: "buy",
        quantity: "",
        price: "",
        date: getCurrentDateString(),
      })

      setOpen(false)
      onTransactionAdded()

      toast({
        title: "Sucesso",
        description: `Transação adicionada com sucesso! Data: ${formData.date} ${useLocalStorage ? "(Salvo localmente)" : ""}`,
      })
    } catch (error) {
      console.error("Erro ao criar transação:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar transação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const total =
    formData.type === "dividend"
      ? Number(formData.price) || 0
      : (Number(formData.quantity) || 0) * (Number(formData.price) || 0)

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={true}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Registre suas compras, vendas e dividendos recebidos
            {useLocalStorage && (
              <span className="block text-yellow-600 dark:text-yellow-400 mt-1">
                ⚠️ Dados serão salvos localmente (Supabase indisponível)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Ticker da Ação *</Label>
              <Input
                id="symbol"
                placeholder="Ex: VALE3"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "buy" | "sell" | "dividend") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Compra</SelectItem>
                  <SelectItem value="sell">Venda</SelectItem>
                  <SelectItem value="dividend">Dividendo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Nome da Empresa *</Label>
            <Input
              id="company_name"
              placeholder="Ex: Vale S.A."
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              required
            />
          </div>

          {formData.type !== "dividend" && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Ex: 100"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required={formData.type !== "dividend"}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">
              {formData.type === "dividend" ? "Valor do Dividendo (R$) *" : "Preço por Ação (R$) *"}
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder={formData.type === "dividend" ? "Ex: 150.00" : "Ex: 32.50"}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => {
                console.log("📅 Data selecionada:", e.target.value)
                setFormData({ ...formData, date: e.target.value })
              }}
              required
              disabled={loading}
              min="2020-01-01"
              max="2030-12-31"
            />
            <div className="text-xs text-muted-foreground">
              Data atual: {getCurrentDateString()} | Selecionada: {formData.date}
            </div>
          </div>

          {total > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {formData.type === "dividend" ? "Valor Total:" : "Total da Operação:"}
                  </span>
                  <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Adicionar Transação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
