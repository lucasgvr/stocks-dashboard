"use client"

import type React from "react"
import { useState } from "react"
import { Calendar, TrendingUp, TrendingDown, Gift, Shuffle, Split } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getCurrentDateString } from "@/lib/date-utils"
import { validateCorporateEvent, generateEventDescription, type CorporateEvent } from "@/lib/corporate-events"
import { createCorporateEvent } from "@/lib/supabase-events"
import { createCorporateEventLocal } from "@/lib/local-storage-events"

interface CorporateEventModalProps {
  onEventAdded: () => void
  useLocalStorage: boolean
  prefilledSymbol?: string
}

export function CorporateEventModal({ onEventAdded, useLocalStorage, prefilledSymbol }: CorporateEventModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    symbol: prefilledSymbol || "",
    company_name: "",
    event_type: "" as CorporateEvent["event_type"] | "",
    event_date: getCurrentDateString(),

    // Para splits/grupamentos
    ratio_from: "",
    ratio_to: "",

    // Para fusões
    new_symbol: "",
    new_company_name: "",
    cash_per_share: "",
    new_shares_per_old: "",

    // Para bonificações
    bonus_shares_per_old: "",

    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Preparar dados do evento
      const eventData: Partial<CorporateEvent> = {
        symbol: formData.symbol.toUpperCase(),
        company_name: formData.company_name,
        event_type: formData.event_type as CorporateEvent["event_type"],
        event_date: formData.event_date,
        description: formData.description,
      }

      // Adicionar campos específicos por tipo
      switch (formData.event_type) {
        case "split":
        case "reverse_split":
          eventData.ratio_from = Number.parseInt(formData.ratio_from)
          eventData.ratio_to = Number.parseInt(formData.ratio_to)
          break

        case "bonus":
          eventData.bonus_shares_per_old = Number.parseFloat(formData.bonus_shares_per_old)
          break

        case "merger":
          eventData.new_symbol = formData.new_symbol.toUpperCase()
          eventData.new_company_name = formData.new_company_name
          eventData.cash_per_share = Number.parseFloat(formData.cash_per_share) || 0
          eventData.new_shares_per_old = Number.parseFloat(formData.new_shares_per_old) || 0
          break

        case "spinoff":
          eventData.new_symbol = formData.new_symbol.toUpperCase()
          eventData.new_company_name = formData.new_company_name
          eventData.new_shares_per_old = Number.parseFloat(formData.new_shares_per_old)
          break
      }

      // Validar dados
      const errors = validateCorporateEvent(eventData)
      if (errors.length > 0) {
        toast({
          title: "Erro de Validação",
          description: errors.join(", "),
          variant: "destructive",
        })
        return
      }

      // Gerar descrição automática se não fornecida
      if (!eventData.description) {
        eventData.description = generateEventDescription(eventData as CorporateEvent)
      }

      // Salvar evento
      if (useLocalStorage) {
        createCorporateEventLocal(eventData as Omit<CorporateEvent, "id" | "created_at" | "updated_at" | "processed">)
      } else {
        await createCorporateEvent(eventData as Omit<CorporateEvent, "id" | "created_at" | "updated_at" | "processed">)
      }

      // Reset form
      setFormData({
        symbol: prefilledSymbol || "",
        company_name: "",
        event_type: "",
        event_date: getCurrentDateString(),
        ratio_from: "",
        ratio_to: "",
        new_symbol: "",
        new_company_name: "",
        cash_per_share: "",
        new_shares_per_old: "",
        bonus_shares_per_old: "",
        description: "",
      })

      setOpen(false)
      onEventAdded()

      toast({
        title: "Sucesso",
        description: `Evento corporativo adicionado com sucesso! ${useLocalStorage ? "(Salvo localmente)" : ""}`,
      })
    } catch (error) {
      console.error("Erro ao criar evento corporativo:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar evento corporativo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "split":
        return <Split className="h-4 w-4" />
      case "reverse_split":
        return <TrendingDown className="h-4 w-4" />
      case "bonus":
        return <Gift className="h-4 w-4" />
      case "merger":
        return <Shuffle className="h-4 w-4" />
      case "spinoff":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const renderEventSpecificFields = () => {
    switch (formData.event_type) {
      case "split":
      case "reverse_split":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ratio_from">De (quantidade) *</Label>
              <Input
                id="ratio_from"
                type="number"
                placeholder="Ex: 1"
                value={formData.ratio_from}
                onChange={(e) => setFormData({ ...formData, ratio_from: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ratio_to">Para (quantidade) *</Label>
              <Input
                id="ratio_to"
                type="number"
                placeholder="Ex: 2"
                value={formData.ratio_to}
                onChange={(e) => setFormData({ ...formData, ratio_to: e.target.value })}
                required
              />
            </div>
          </div>
        )

      case "bonus":
        return (
          <div className="space-y-2">
            <Label htmlFor="bonus_shares_per_old">Ações bonificadas por ação possuída *</Label>
            <Input
              id="bonus_shares_per_old"
              type="number"
              step="0.01"
              placeholder="Ex: 0.1 (10% de bonificação)"
              value={formData.bonus_shares_per_old}
              onChange={(e) => setFormData({ ...formData, bonus_shares_per_old: e.target.value })}
              required
            />
          </div>
        )

      case "merger":
      case "spinoff":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_symbol">Novo Ticker *</Label>
                <Input
                  id="new_symbol"
                  placeholder="Ex: NOVA3"
                  value={formData.new_symbol}
                  onChange={(e) => setFormData({ ...formData, new_symbol: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_shares_per_old">Novas ações por ação antiga *</Label>
                <Input
                  id="new_shares_per_old"
                  type="number"
                  step="0.0001"
                  placeholder="Ex: 0.5"
                  value={formData.new_shares_per_old}
                  onChange={(e) => setFormData({ ...formData, new_shares_per_old: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_company_name">Nome da Nova Empresa *</Label>
              <Input
                id="new_company_name"
                placeholder="Ex: Nova Empresa S.A."
                value={formData.new_company_name}
                onChange={(e) => setFormData({ ...formData, new_company_name: e.target.value })}
                required
              />
            </div>

            {formData.event_type === "merger" && (
              <div className="space-y-2">
                <Label htmlFor="cash_per_share">Dinheiro por ação (R$)</Label>
                <Input
                  id="cash_per_share"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5.50"
                  value={formData.cash_per_share}
                  onChange={(e) => setFormData({ ...formData, cash_per_share: e.target.value })}
                />
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Evento Corporativo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Evento Corporativo</DialogTitle>
          <DialogDescription>
            Registre splits, grupamentos, bonificações, fusões e spin-offs
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
              <Label htmlFor="event_type">Tipo de Evento *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value: CorporateEvent["event_type"]) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="split">
                    <div className="flex items-center gap-2">
                      <Split className="h-4 w-4" />
                      Desdobramento (Split)
                    </div>
                  </SelectItem>
                  <SelectItem value="reverse_split">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Grupamento (Reverse Split)
                    </div>
                  </SelectItem>
                  <SelectItem value="bonus">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Bonificação
                    </div>
                  </SelectItem>
                  <SelectItem value="merger">
                    <div className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4" />
                      Fusão/Incorporação
                    </div>
                  </SelectItem>
                  <SelectItem value="spinoff">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Spin-off
                    </div>
                  </SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="event_date">Data do Evento *</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              required
            />
          </div>

          {/* Campos específicos por tipo de evento */}
          {renderEventSpecificFields()}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descrição adicional do evento..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Preview da descrição automática */}
          {formData.event_type && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {getEventIcon(formData.event_type)}
                  <span className="font-semibold">Preview:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {generateEventDescription({
                    ...formData,
                    ratio_from: Number.parseInt(formData.ratio_from) || 0,
                    ratio_to: Number.parseInt(formData.ratio_to) || 0,
                    bonus_shares_per_old: Number.parseFloat(formData.bonus_shares_per_old) || 0,
                    new_shares_per_old: Number.parseFloat(formData.new_shares_per_old) || 0,
                    cash_per_share: Number.parseFloat(formData.cash_per_share) || 0,
                  } as CorporateEvent)}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Adicionar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
