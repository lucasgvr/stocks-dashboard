"use client"

import { useState } from "react"
import { Calendar, DollarSign, TrendingUp, TrendingDown, Trash2 } from "lucide-react"
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
import type { CalculatedPosition } from "@/lib/portfolio"
import { formatCurrency, formatNumber } from "@/lib/portfolio"
import { deleteTransaction } from "@/lib/supabase"
import { deleteTransactionLocal } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay } from "@/lib/date-utils"

interface TransactionsDialogProps {
  position: CalculatedPosition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransactionDeleted: () => void
  useLocalStorage: boolean
}

export function TransactionsDialog({
  position,
  open,
  onOpenChange,
  onTransactionDeleted,
  useLocalStorage,
}: TransactionsDialogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteTransaction = async (id: string) => {
    setDeletingId(id)
    try {
      if (useLocalStorage) {
        deleteTransactionLocal(id)
      } else {
        await deleteTransaction(id)
      }

      onTransactionDeleted()
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao excluir transação:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir transação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (!position) {
    return (
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <div>Carregando...</div>
        </DialogContent>
      </Dialog>
    )
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "sell":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "dividend":
        return <DollarSign className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "buy":
        return "Compra"
      case "sell":
        return "Venda"
      case "dividend":
        return "Dividendo"
      default:
        return type
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "buy":
        return "bg-green-100 text-green-800"
      case "sell":
        return "bg-red-100 text-red-800"
      case "dividend":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {position.symbol.substring(0, 2)}
            </div>
            {position.symbol} - Transações
          </DialogTitle>
          <DialogDescription>
            {position.company_name}
            {useLocalStorage && <span className="block text-yellow-600 mt-1">📱 Dados salvos localmente</span>}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da Posição */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Total de Ações</div>
                <div className="font-semibold">{formatNumber(position.total_shares)}</div>
              </div>
              <div>
                <div className="text-gray-500">Preço Médio</div>
                <div className="font-semibold">{formatCurrency(position.average_price)}</div>
              </div>
              <div>
                <div className="text-gray-500">Investido</div>
                <div className="font-semibold">{formatCurrency(position.total_invested)}</div>
              </div>
              <div>
                <div className="text-gray-500">Dividendos 12m</div>
                <div className="font-semibold text-green-600">{formatCurrency(position.dividends_received_12m)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Transações */}
        <div className="space-y-3">
          <h4 className="font-semibold">Histórico de Transações</h4>
          {position.transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTransactionColor(transaction.type)}>
                          {getTransactionLabel(transaction.type)}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateForDisplay(transaction.date)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {transaction.type === "dividend"
                          ? `Dividendo: ${formatCurrency(transaction.total)}`
                          : `${formatNumber(transaction.quantity)} ações × ${formatCurrency(transaction.price)} = ${formatCurrency(transaction.total)}`}
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={deletingId === transaction.id}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
