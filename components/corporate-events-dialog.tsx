"use client"

import { useState, useEffect } from "react"
import { Calendar, Trash2, CheckCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay } from "@/lib/date-utils"
import type { CorporateEvent } from "@/lib/corporate-events"
import { getCorporateEvents, deleteCorporateEvent, markEventAsProcessed } from "@/lib/supabase-events"
import {
  getCorporateEventsLocal,
  deleteCorporateEventLocal,
  updateCorporateEventLocal,
} from "@/lib/local-storage-events"

interface CorporateEventsDialogProps {
  symbol?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  useLocalStorage: boolean
}

export function CorporateEventsDialog({ symbol, open, onOpenChange, useLocalStorage }: CorporateEventsDialogProps) {
  const [events, setEvents] = useState<CorporateEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadEvents = async () => {
    setLoading(true)
    try {
      if (useLocalStorage) {
        const allEvents = getCorporateEventsLocal()
        setEvents(symbol ? allEvents.filter((e) => e.symbol === symbol) : allEvents)
      } else {
        const data = await getCorporateEvents(symbol)
        setEvents(data)
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos corporativos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadEvents()
    }
  }, [open, symbol, useLocalStorage])

  const handleDeleteEvent = async (id: string) => {
    setDeletingId(id)
    try {
      if (useLocalStorage) {
        deleteCorporateEventLocal(id)
      } else {
        await deleteCorporateEvent(id)
      }

      await loadEvents()
      toast({
        title: "Sucesso",
        description: "Evento corporativo excluído com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir evento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkAsProcessed = async (id: string) => {
    try {
      if (useLocalStorage) {
        updateCorporateEventLocal(id, { processed: true })
      } else {
        await markEventAsProcessed(id)
      }

      await loadEvents()
      toast({
        title: "Sucesso",
        description: "Evento marcado como processado!",
      })
    } catch (error) {
      console.error("Erro ao marcar evento:", error)
      toast({
        title: "Erro",
        description: "Erro ao marcar evento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "split":
        return "Desdobramento"
      case "reverse_split":
        return "Grupamento"
      case "bonus":
        return "Bonificação"
      case "merger":
        return "Fusão"
      case "spinoff":
        return "Spin-off"
      default:
        return type
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "split":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "reverse_split":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "bonus":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "merger":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "spinoff":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Eventos Corporativos {symbol && `- ${symbol}`}
          </DialogTitle>
          <DialogDescription>
            Histórico de splits, grupamentos, bonificações e outros eventos
            {useLocalStorage && <span className="block text-yellow-600 mt-1">📱 Dados salvos localmente</span>}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground">
                {symbol
                  ? `Não há eventos corporativos registrados para ${symbol}`
                  : "Não há eventos corporativos registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getEventTypeColor(event.event_type)}>
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        <span className="text-sm font-semibold">{event.symbol}</span>
                        <span className="text-sm text-muted-foreground">{formatDateForDisplay(event.event_date)}</span>
                        {event.processed ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Processado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-medium mb-1">{event.company_name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>

                      {/* Detalhes específicos do evento */}
                      <div className="text-xs text-muted-foreground">
                        {event.event_type === "split" || event.event_type === "reverse_split" ? (
                          <span>
                            Proporção: {event.ratio_from}:{event.ratio_to}
                          </span>
                        ) : event.event_type === "bonus" ? (
                          <span>Bonificação: {event.bonus_shares_per_old} ações por ação</span>
                        ) : event.event_type === "merger" ? (
                          <span>
                            → {event.new_symbol} ({event.new_shares_per_old} ações)
                            {event.cash_per_share && ` + R$ ${event.cash_per_share}/ação`}
                          </span>
                        ) : event.event_type === "spinoff" ? (
                          <span>
                            → {event.new_symbol} ({event.new_shares_per_old} ações por ação)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!event.processed && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkAsProcessed(event.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={deletingId === event.id}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Evento Corporativo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEvent(event.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
