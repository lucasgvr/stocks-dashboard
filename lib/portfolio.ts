import type { Transaction } from "./supabase"
import type { LocalTransaction } from "./local-storage"

// Adicionar import dos eventos corporativos
import type { CorporateEvent } from "./corporate-events"
import { calculateEventAdjustments } from "./corporate-events"

// Atualizar a interface CalculatedPosition para incluir eventos
export interface CalculatedPosition {
  symbol: string
  company_name: string
  total_shares: number
  average_price: number
  total_invested: number
  dividends_received_12m: number
  dividend_yield: number
  current_price?: number
  current_value?: number
  profit_loss?: number
  profit_loss_percent?: number
  fair_price?: number
  safety_margin?: number
  transactions: (Transaction | LocalTransaction)[]
  corporate_events?: CorporateEvent[]
  is_sold_out: boolean
}

// Atualizar a função calculateAllPositions para incluir eventos corporativos
export function calculateAllPositions(
  transactions: (Transaction | LocalTransaction)[],
  stockPrices: { [symbol: string]: number } = {},
  fairPrices: { [symbol: string]: number } = {},
  corporateEvents: CorporateEvent[] = [],
): CalculatedPosition[] {
  const positionsMap = new Map<
    string,
    {
      total_shares: number
      total_invested: number
      dividends_received_12m: number
      transactions: (Transaction | LocalTransaction)[]
      corporate_events: CorporateEvent[]
      company_name: string
    }
  >()

  // Data de 12 meses atrás
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)

  // Processa todas as transações
  transactions.forEach((transaction) => {
    const existing = positionsMap.get(transaction.symbol) || {
      total_shares: 0,
      total_invested: 0,
      dividends_received_12m: 0,
      transactions: [],
      corporate_events: [],
      company_name: transaction.company_name,
    }

    if (transaction.type === "buy") {
      existing.total_shares += transaction.quantity
      existing.total_invested += transaction.total
    } else if (transaction.type === "sell") {
      const avgPrice = existing.total_shares > 0 ? existing.total_invested / existing.total_shares : 0
      existing.total_shares -= transaction.quantity
      existing.total_invested -= avgPrice * transaction.quantity
    } else if (transaction.type === "dividend") {
      // Verifica se o dividendo foi nos últimos 12 meses
      const transactionDate = new Date(transaction.date)
      if (transactionDate >= twelveMonthsAgo) {
        existing.dividends_received_12m += transaction.total
      }
    }

    existing.transactions.push(transaction)
    positionsMap.set(transaction.symbol, existing)
  })

  // Adicionar eventos corporativos às posições
  corporateEvents.forEach((event) => {
    const existing = positionsMap.get(event.symbol)
    if (existing) {
      existing.corporate_events.push(event)
    }
  })

  // Aplicar ajustes de eventos corporativos
  positionsMap.forEach((data, symbol) => {
    // Ordenar eventos por data
    const sortedEvents = data.corporate_events.sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
    )

    // Aplicar cada evento em ordem cronológica
    sortedEvents.forEach((event) => {
      if (event.processed) {
        const adjustments = calculateEventAdjustments(event, data.total_shares)

        // Aplicar ajustes
        data.total_shares = adjustments.new_quantity

        // Ajustar preço médio
        if (adjustments.price_adjustment_factor !== 1) {
          data.total_invested = data.total_invested // Manter valor investido
          // O preço médio será recalculado automaticamente
        }

        // Para fusões, criar nova posição se necessário
        if (event.event_type === "merger" && event.new_symbol && adjustments.new_symbol_quantity) {
          // Aqui você poderia criar uma nova posição para o novo símbolo
          // Por simplicidade, vamos apenas registrar o evento
        }
      }
    })
  })

  // Converte para array de posições (TODAS as posições, incluindo vendidas)
  const positions: CalculatedPosition[] = []

  positionsMap.forEach((data, symbol) => {
    const average_price =
      Math.abs(data.total_invested) > 0.01 ? Math.abs(data.total_invested) / Math.max(data.total_shares, 1) : 0
    const dividend_yield =
      Math.abs(data.total_invested) > 0.01 ? (data.dividends_received_12m / Math.abs(data.total_invested)) * 100 : 0
    const is_sold_out = data.total_shares <= 0

    // Aplica preço atual se disponível
    const current_price = stockPrices[symbol]
    const fair_price = fairPrices[symbol]
    let current_value: number | undefined
    let profit_loss: number | undefined
    let profit_loss_percent: number | undefined
    let safety_margin: number | undefined

    if (current_price && !is_sold_out) {
      current_value = data.total_shares * current_price
      profit_loss = current_value - data.total_invested
      profit_loss_percent = data.total_invested > 0 ? (profit_loss / data.total_invested) * 100 : 0
    }

    // Calcula margem de segurança se tiver preço justo e preço atual
    if (fair_price && current_price && fair_price > 0) {
      safety_margin = ((fair_price - current_price) / fair_price) * 100
    }

    positions.push({
      symbol,
      company_name: data.company_name,
      total_shares: data.total_shares,
      average_price,
      total_invested: data.total_invested,
      dividends_received_12m: data.dividends_received_12m,
      dividend_yield,
      current_price,
      current_value,
      profit_loss,
      profit_loss_percent,
      fair_price,
      safety_margin,
      transactions: data.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      corporate_events: data.corporate_events,
      is_sold_out,
    })
  })

  return positions.sort((a, b) => {
    // Posições ativas primeiro, depois por valor investido
    if (a.is_sold_out !== b.is_sold_out) {
      return a.is_sold_out ? 1 : -1
    }
    return Math.abs(b.total_invested) - Math.abs(a.total_invested)
  })
}

// Atualizar a função calculatePositions para incluir eventos
export function calculatePositions(
  transactions: (Transaction | LocalTransaction)[],
  stockPrices: { [symbol: string]: number } = {},
  fairPrices: { [symbol: string]: number } = {},
  corporateEvents: CorporateEvent[] = [],
): CalculatedPosition[] {
  return calculateAllPositions(transactions, stockPrices, fairPrices, corporateEvents).filter(
    (position) => !position.is_sold_out,
  )
}

// Função para atualizar preço atual de uma posição
export function updatePositionPrice(position: CalculatedPosition, currentPrice: number): CalculatedPosition {
  if (position.total_shares <= 0) {
    return { ...position, current_price: currentPrice }
  }

  const current_value = position.total_shares * currentPrice
  const profit_loss = current_value - position.total_invested
  const profit_loss_percent = position.total_invested > 0 ? (profit_loss / position.total_invested) * 100 : 0

  // Recalcula margem de segurança se tiver preço justo
  let safety_margin: number | undefined
  if (position.fair_price && position.fair_price > 0) {
    safety_margin = ((position.fair_price - currentPrice) / position.fair_price) * 100
  }

  return {
    ...position,
    current_price: currentPrice,
    current_value,
    profit_loss,
    profit_loss_percent,
    safety_margin,
  }
}

// Função para formatar moeda
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// Função para formatar número
export const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value)
}
