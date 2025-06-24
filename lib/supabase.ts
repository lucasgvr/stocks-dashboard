import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Transaction {
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

export interface StockPrice {
  id: string
  symbol: string
  current_price: number
  updated_at: string
}

export interface FairPrice {
  id: string
  symbol: string
  fair_price: number
  years_analyzed: number
  average_dividend: number
  dividend_data: Record<number, number>
  updated_at: string
}

// Função simplificada para verificar se o Supabase está funcionando
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("transactions").select("id").limit(1)

    if (error) {
      // Se a tabela não existe, isso é esperado na primeira vez
      if (error.message.includes("does not exist")) {
        console.log("Tabela transactions não existe - usando modo local")
        return false
      }
      throw error
    }

    return true
  } catch (error) {
    console.log("Supabase não disponível:", error)
    return false
  }
}

// Funções para transações
// Na função createTransaction, vamos garantir que a data seja salva corretamente:

export async function createTransaction(transaction: Omit<Transaction, "id" | "created_at" | "updated_at">) {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          ...transaction,
          // Garantir que a data seja salva exatamente como recebida
          date: transaction.date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao criar transação:", error)
    throw error
  }
}

export async function getTransactions() {
  try {
    const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    throw error
  }
}

export async function deleteTransaction(id: string) {
  try {
    const { error } = await supabase.from("transactions").delete().eq("id", id)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar transação:", error)
    throw error
  }
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao atualizar transação:", error)
    throw error
  }
}

// Funções para preços das ações
export async function saveStockPrice(symbol: string, currentPrice: number) {
  try {
    const { data, error } = await supabase
      .from("stock_prices")
      .upsert(
        {
          symbol,
          current_price: currentPrice,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "symbol",
        },
      )
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao salvar preço:", error)
    throw error
  }
}

export async function getStockPrices() {
  try {
    const { data, error } = await supabase.from("stock_prices").select("*")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar preços:", error)
    throw error
  }
}

export async function getStockPrice(symbol: string) {
  try {
    const { data, error } = await supabase.from("stock_prices").select("*").eq("symbol", symbol).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Não encontrado
        return null
      }
      throw error
    }
    return data
  } catch (error) {
    console.error("Erro ao buscar preço:", error)
    throw error
  }
}

// Funções para preços justos
export async function saveFairPrice(fairPriceData: Omit<FairPrice, "id" | "updated_at">) {
  try {
    const { data, error } = await supabase
      .from("fair_prices")
      .upsert(
        {
          ...fairPriceData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "symbol",
        },
      )
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao salvar preço justo:", error)
    throw error
  }
}

export async function getFairPrices() {
  try {
    const { data, error } = await supabase.from("fair_prices").select("*")

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar preços justos:", error)
    throw error
  }
}

export async function getFairPrice(symbol: string) {
  try {
    const { data, error } = await supabase.from("fair_prices").select("*").eq("symbol", symbol).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Não encontrado
        return null
      }
      throw error
    }
    return data
  } catch (error) {
    console.error("Erro ao buscar preço justo:", error)
    throw error
  }
}
