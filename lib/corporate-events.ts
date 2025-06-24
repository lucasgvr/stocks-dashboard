export interface CorporateEvent {
  id: string
  symbol: string
  company_name: string
  event_type: "split" | "reverse_split" | "bonus" | "merger" | "spinoff"
  event_date: string

  // Para splits e grupamentos
  ratio_from?: number
  ratio_to?: number

  // Para fusões
  new_symbol?: string
  new_company_name?: string
  cash_per_share?: number
  new_shares_per_old?: number

  // Para bonificações
  bonus_shares_per_old?: number

  description?: string
  processed: boolean
  created_at: string
  updated_at: string
}

export interface ProcessedEvent {
  event: CorporateEvent
  adjustments: {
    old_quantity: number
    new_quantity: number
    cash_received?: number
    new_symbol_quantity?: number
    price_adjustment_factor: number
  }
}

// Função para calcular ajustes de eventos corporativos
export function calculateEventAdjustments(
  event: CorporateEvent,
  currentQuantity: number,
): ProcessedEvent["adjustments"] {
  const adjustments: ProcessedEvent["adjustments"] = {
    old_quantity: currentQuantity,
    new_quantity: currentQuantity,
    price_adjustment_factor: 1,
  }

  switch (event.event_type) {
    case "split":
      // Desdobramento: 1 ação vira N ações
      if (event.ratio_from && event.ratio_to) {
        const splitRatio = event.ratio_to / event.ratio_from
        adjustments.new_quantity = Math.floor(currentQuantity * splitRatio)
        adjustments.price_adjustment_factor = 1 / splitRatio
      }
      break

    case "reverse_split":
      // Grupamento: N ações viram 1 ação
      if (event.ratio_from && event.ratio_to) {
        const groupRatio = event.ratio_to / event.ratio_from
        adjustments.new_quantity = Math.floor(currentQuantity * groupRatio)
        adjustments.price_adjustment_factor = 1 / groupRatio
      }
      break

    case "bonus":
      // Bonificação: recebe ações gratuitas
      if (event.bonus_shares_per_old) {
        const bonusShares = Math.floor(currentQuantity * event.bonus_shares_per_old)
        adjustments.new_quantity = currentQuantity + bonusShares
        adjustments.price_adjustment_factor = currentQuantity / adjustments.new_quantity
      }
      break

    case "merger":
      // Fusão: recebe ações de outra empresa + dinheiro
      if (event.new_shares_per_old && event.cash_per_share) {
        adjustments.new_symbol_quantity = Math.floor(currentQuantity * event.new_shares_per_old)
        adjustments.cash_received = currentQuantity * event.cash_per_share
        adjustments.new_quantity = 0 // Ações originais são convertidas
      }
      break

    case "spinoff":
      // Spin-off: mantém ações originais + recebe ações da nova empresa
      if (event.new_shares_per_old) {
        adjustments.new_symbol_quantity = Math.floor(currentQuantity * event.new_shares_per_old)
        adjustments.new_quantity = currentQuantity // Mantém as originais
      }
      break
  }

  return adjustments
}

// Função para gerar descrição automática do evento
export function generateEventDescription(event: CorporateEvent): string {
  switch (event.event_type) {
    case "split":
      return `Desdobramento ${event.ratio_from}:${event.ratio_to} - Cada ${event.ratio_from} ação vira ${event.ratio_to} ações`

    case "reverse_split":
      return `Grupamento ${event.ratio_from}:${event.ratio_to} - Cada ${event.ratio_from} ações vira ${event.ratio_to} ação`

    case "bonus":
      return `Bonificação de ${event.bonus_shares_per_old} ações para cada 1 ação possuída`

    case "merger":
      return `Fusão: Recebe ${event.new_shares_per_old} ações de ${event.new_symbol} + R$ ${event.cash_per_share} por ação`

    case "spinoff":
      return `Spin-off: Recebe ${event.new_shares_per_old} ações de ${event.new_symbol} para cada ação de ${event.symbol}`

    default:
      return event.description || "Evento corporativo"
  }
}

// Função para validar dados do evento
export function validateCorporateEvent(event: Partial<CorporateEvent>): string[] {
  const errors: string[] = []

  if (!event.symbol) errors.push("Ticker é obrigatório")
  if (!event.company_name) errors.push("Nome da empresa é obrigatório")
  if (!event.event_type) errors.push("Tipo de evento é obrigatório")
  if (!event.event_date) errors.push("Data do evento é obrigatória")

  switch (event.event_type) {
    case "split":
    case "reverse_split":
      if (!event.ratio_from || !event.ratio_to) {
        errors.push("Proporção (de:para) é obrigatória para splits/grupamentos")
      }
      if (event.ratio_from && event.ratio_from <= 0) {
        errors.push('Proporção "de" deve ser maior que zero')
      }
      if (event.ratio_to && event.ratio_to <= 0) {
        errors.push('Proporção "para" deve ser maior que zero')
      }
      break

    case "bonus":
      if (!event.bonus_shares_per_old || event.bonus_shares_per_old <= 0) {
        errors.push("Quantidade de ações bonificadas deve ser maior que zero")
      }
      break

    case "merger":
      if (!event.new_symbol) errors.push("Novo ticker é obrigatório para fusões")
      if (!event.new_company_name) errors.push("Nome da nova empresa é obrigatório")
      if (!event.new_shares_per_old && !event.cash_per_share) {
        errors.push("Deve especificar ações recebidas ou dinheiro por ação")
      }
      break

    case "spinoff":
      if (!event.new_symbol) errors.push("Ticker da nova empresa é obrigatório")
      if (!event.new_company_name) errors.push("Nome da nova empresa é obrigatório")
      if (!event.new_shares_per_old || event.new_shares_per_old <= 0) {
        errors.push("Quantidade de ações da nova empresa deve ser maior que zero")
      }
      break
  }

  return errors
}
