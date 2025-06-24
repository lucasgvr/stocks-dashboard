// Script para importar transações do CSV para o banco de dados
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variáveis de ambiente do Supabase não configuradas")
  console.log("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para buscar e processar o CSV
async function fetchAndProcessCSV() {
  try {
    console.log("📥 Buscando arquivo CSV...")

    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Control%20-%20P%C3%A1gina13-gwUXxfGTZRaDHex903H26OasET2KdY.csv",
    )

    if (!response.ok) {
      throw new Error(`Erro ao buscar CSV: ${response.status}`)
    }

    const csvText = await response.text()
    console.log("✅ Arquivo CSV carregado com sucesso")

    // Processar CSV
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    console.log("📋 Cabeçalhos encontrados:", headers)
    console.log(`📊 Total de linhas: ${lines.length - 1}`)

    const transactions = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())

      if (values.length < 6) continue // Pular linhas incompletas

      const [data, ticker, quantidade, preco, empresa, tipo] = values

      // Converter data de DD/MM/YYYY para YYYY-MM-DD
      const [day, month, year] = data.split("/")
      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`

      // Limpar e converter preço (remover R$ e vírgula)
      const cleanPrice = Number.parseFloat(preco.replace("R$", "").replace(",", ".").trim())

      // Converter quantidade
      const qty = Number.parseInt(quantidade)

      // Determinar tipo da transação
      const transactionType = tipo.toLowerCase().includes("compra") ? "buy" : "sell"

      // Calcular total
      const total = qty * cleanPrice

      const transaction = {
        symbol: ticker.toUpperCase(),
        company_name: empresa,
        type: transactionType,
        quantity: qty,
        price: cleanPrice,
        total: total,
        date: formattedDate,
      }

      transactions.push(transaction)

      console.log(`📝 Processada: ${ticker} - ${tipo} - ${qty} ações - ${preco} - ${data}`)
    }

    return transactions
  } catch (error) {
    console.error("❌ Erro ao processar CSV:", error)
    throw error
  }
}

// Função para inserir transações no Supabase
async function insertTransactions(transactions) {
  try {
    console.log(`\n💾 Inserindo ${transactions.length} transações no banco...`)

    // Inserir em lotes de 10 para evitar timeout
    const batchSize = 10
    let inserted = 0

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)

      const { data, error } = await supabase.from("transactions").insert(
        batch.map((t) => ({
          ...t,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      )

      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error)
        throw error
      }

      inserted += batch.length
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} inserido (${inserted}/${transactions.length})`)

      // Pequena pausa entre lotes
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(`\n🎉 Sucesso! ${inserted} transações inseridas no banco de dados`)
  } catch (error) {
    console.error("❌ Erro ao inserir transações:", error)
    throw error
  }
}

// Função para verificar transações existentes
async function checkExistingTransactions() {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, symbol, date, type")
      .order("date", { ascending: false })

    if (error) throw error

    console.log(`📊 Transações existentes no banco: ${data?.length || 0}`)

    if (data && data.length > 0) {
      console.log("🔍 Últimas 3 transações:")
      data.slice(0, 3).forEach((t) => {
        console.log(`   - ${t.symbol} (${t.type}) em ${t.date}`)
      })
    }

    return data || []
  } catch (error) {
    console.error("❌ Erro ao verificar transações existentes:", error)
    return []
  }
}

// Função principal
async function main() {
  try {
    console.log("🚀 Iniciando importação de transações...\n")

    // Verificar conexão com Supabase
    console.log("🔗 Verificando conexão com Supabase...")
    const { data: testData, error: testError } = await supabase.from("transactions").select("id").limit(1)

    if (testError) {
      console.error("❌ Erro de conexão com Supabase:", testError)
      return
    }

    console.log("✅ Conexão com Supabase estabelecida\n")

    // Verificar transações existentes
    await checkExistingTransactions()

    // Processar CSV
    const transactions = await fetchAndProcessCSV()

    if (transactions.length === 0) {
      console.log("⚠️ Nenhuma transação encontrada no CSV")
      return
    }

    // Mostrar resumo das transações
    console.log("\n📈 Resumo das transações a serem importadas:")
    const summary = transactions.reduce((acc, t) => {
      acc[t.symbol] = (acc[t.symbol] || 0) + 1
      return acc
    }, {})

    Object.entries(summary).forEach(([symbol, count]) => {
      console.log(`   - ${symbol}: ${count} transação${count > 1 ? "ões" : ""}`)
    })

    // Confirmar importação
    console.log(`\n❓ Deseja importar ${transactions.length} transações? (Executando automaticamente...)`)

    // Inserir transações
    await insertTransactions(transactions)

    // Verificar resultado final
    console.log("\n🔍 Verificando resultado final...")
    await checkExistingTransactions()

    console.log("\n✨ Importação concluída com sucesso!")
    console.log("💡 Agora você pode visualizar suas transações na aplicação")
  } catch (error) {
    console.error("\n💥 Erro durante a importação:", error)
    process.exit(1)
  }
}

// Executar script
main()
