// Sistema de fallback usando localStorage quando Supabase não estiver disponível
export interface LocalTransaction {
  id: string
  symbol: string
  company_name: string
  type: "buy" | "sell" | "dividend"
  quantity: number
  price: number
  total: number
  date: string
  created_at: string
  updated_at: string
}

export interface LocalStockPrice {
  symbol: string
  current_price: number
  updated_at: string
}

export interface LocalFairPrice {
  symbol: string
  fair_price: number
  years_analyzed: number
  average_dividend: number
  dividend_data: Record<number, number>
  updated_at: string
}

const STORAGE_KEY = "portfolio-transactions"
const PRICES_STORAGE_KEY = "portfolio-stock-prices"
const FAIR_PRICES_STORAGE_KEY = "portfolio-fair-prices"

export function saveTransactionsLocal(transactions: LocalTransaction[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }
}

export function getTransactionsLocal(): LocalTransaction[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  }
  return []
}

// Na função createTransactionLocal, garantir que a data seja preservada:

export function createTransactionLocal(
  transaction: Omit<LocalTransaction, "id" | "created_at" | "updated_at">,
): LocalTransaction {
  const newTransaction: LocalTransaction = {
    ...transaction,
    // Preservar a data exatamente como recebida
    date: transaction.date,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const transactions = getTransactionsLocal()
  transactions.unshift(newTransaction)
  saveTransactionsLocal(transactions)

  return newTransaction
}

export function deleteTransactionLocal(id: string) {
  const transactions = getTransactionsLocal()
  const filtered = transactions.filter((t) => t.id !== id)
  saveTransactionsLocal(filtered)
}

export function updateTransactionLocal(id: string, updates: Partial<LocalTransaction>) {
  const transactions = getTransactionsLocal()
  const index = transactions.findIndex((t) => t.id === id)

  if (index !== -1) {
    transactions[index] = {
      ...transactions[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    saveTransactionsLocal(transactions)
    return transactions[index]
  }

  throw new Error("Transação não encontrada")
}

// Funções para preços das ações no localStorage
export function saveStockPricesLocal(prices: LocalStockPrice[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(prices))
  }
}

export function getStockPricesLocal(): LocalStockPrice[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(PRICES_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  }
  return []
}

export function saveStockPriceLocal(symbol: string, currentPrice: number) {
  const prices = getStockPricesLocal()
  const existingIndex = prices.findIndex((p) => p.symbol === symbol)

  const priceData: LocalStockPrice = {
    symbol,
    current_price: currentPrice,
    updated_at: new Date().toISOString(),
  }

  if (existingIndex !== -1) {
    prices[existingIndex] = priceData
  } else {
    prices.push(priceData)
  }

  saveStockPricesLocal(prices)
  return priceData
}

export function getStockPriceLocal(symbol: string): LocalStockPrice | null {
  const prices = getStockPricesLocal()
  return prices.find((p) => p.symbol === symbol) || null
}

// Funções para preços justos no localStorage
export function saveFairPricesLocal(fairPrices: LocalFairPrice[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(FAIR_PRICES_STORAGE_KEY, JSON.stringify(fairPrices))
  }
}

export function getFairPricesLocal(): LocalFairPrice[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(FAIR_PRICES_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  }
  return []
}

export function saveFairPriceLocal(fairPriceData: Omit<LocalFairPrice, "updated_at">) {
  const fairPrices = getFairPricesLocal()
  const existingIndex = fairPrices.findIndex((p) => p.symbol === fairPriceData.symbol)

  const priceData: LocalFairPrice = {
    ...fairPriceData,
    updated_at: new Date().toISOString(),
  }

  if (existingIndex !== -1) {
    fairPrices[existingIndex] = priceData
  } else {
    fairPrices.push(priceData)
  }

  saveFairPricesLocal(fairPrices)
  return priceData
}

export function getFairPriceLocal(symbol: string): LocalFairPrice | null {
  const fairPrices = getFairPricesLocal()
  return fairPrices.find((p) => p.symbol === symbol) || null
}
