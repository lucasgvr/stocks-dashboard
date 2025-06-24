// Script alternativo para importar transações do CSV
// Usa as variáveis de ambiente já configuradas no projeto

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
    console.log("📄 Primeiras linhas do arquivo:")
    console.log(csvText.split("\n").slice(0, 5).join("\n"))

    // Processar CSV
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    console.log("📋 Cabeçalhos encontrados:", headers)
    console.log(`📊 Total de linhas: ${lines.length - 1}`)

    const transactions = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue // Pular linhas vazias

      // Processar CSV considerando vírgulas dentro de aspas
      const values = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Adicionar último valor

      if (values.length < 6) {
        console.log(`⚠️ Linha ${i} incompleta:`, values)
        continue
      }

      const [data, ticker, quantidade, preco, empresa, tipo] = values

      try {
        // Converter data de DD/MM/YYYY para YYYY-MM-DD
        const [day, month, year] = data.split("/")
        const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`

        // Limpar e converter preço (remover R$ e vírgula)
        const cleanPrice = Number.parseFloat(
          preco
            .replace(/[R$\s]/g, "")
            .replace(",", ".")
            .trim(),
        )

        // Converter quantidade
        const qty = Number.parseInt(quantidade.replace(/\D/g, ""))

        // Determinar tipo da transação
        const transactionType = tipo.toLowerCase().includes("compra") ? "buy" : "sell"

        // Calcular total
        const total = qty * cleanPrice

        if (isNaN(cleanPrice) || isNaN(qty) || qty <= 0 || cleanPrice <= 0) {
          console.log(`⚠️ Dados inválidos na linha ${i}:`, { ticker, quantidade, preco })
          continue
        }

        const transaction = {
          symbol: ticker.toUpperCase().trim(),
          company_name: empresa.trim(),
          type: transactionType,
          quantity: qty,
          price: cleanPrice,
          total: total,
          date: formattedDate,
        }

        transactions.push(transaction)

        console.log(`📝 Processada: ${ticker} - ${tipo} - ${qty} ações - R$ ${cleanPrice.toFixed(2)} - ${data}`)
      } catch (error) {
        console.log(`❌ Erro ao processar linha ${i}:`, error.message)
        console.log(`   Dados: ${values}`)
      }
    }

    return transactions
  } catch (error) {
    console.error("❌ Erro ao processar CSV:", error)
    throw error
  }
}

// Função para gerar SQL de inserção
function generateInsertSQL(transactions) {
  if (transactions.length === 0) return ""

  const values = transactions
    .map((t) => {
      const escapedCompanyName = t.company_name.replace(/'/g, "''")
      return `('${t.symbol}', '${escapedCompanyName}', '${t.type}', ${t.quantity}, ${t.price}, ${t.total}, '${t.date}', NOW(), NOW())`
    })
    .join(",\n  ")

  return `
-- Inserir transações importadas do CSV
INSERT INTO transactions (symbol, company_name, type, quantity, price, total, date, created_at, updated_at)
VALUES
  ${values};

-- Verificar transações inseridas
SELECT 
  symbol,
  company_name,
  type,
  quantity,
  price,
  total,
  date
FROM transactions 
WHERE created_at >= NOW() - INTERVAL '1 minute'
ORDER BY date DESC, symbol;
`
}

// Função principal
async function main() {
  try {
    console.log("🚀 Iniciando processamento do CSV...\n")

    // Processar CSV
    const transactions = await fetchAndProcessCSV()

    if (transactions.length === 0) {
      console.log("⚠️ Nenhuma transação válida encontrada no CSV")
      return
    }

    // Mostrar resumo das transações
    console.log("\n📈 Resumo das transações processadas:")
    const summary = transactions.reduce((acc, t) => {
      if (!acc[t.symbol]) {
        acc[t.symbol] = { buy: 0, sell: 0, total: 0 }
      }
      acc[t.symbol][t.type]++
      acc[t.symbol].total += t.total
      return acc
    }, {})

    Object.entries(summary).forEach(([symbol, data]) => {
      console.log(`   - ${symbol}: ${data.buy} compras, ${data.sell} vendas (Total: R$ ${data.total.toFixed(2)})`)
    })

    console.log(`\n📊 Total: ${transactions.length} transações processadas`)

    // Gerar SQL
    const sql = generateInsertSQL(transactions)

    console.log("\n📝 SQL gerado para inserção:")
    console.log("=".repeat(80))
    console.log(sql)
    console.log("=".repeat(80))

    console.log("\n✅ Processamento concluído!")
    console.log("💡 Copie o SQL acima e execute no banco de dados para inserir as transações")
    console.log("🔧 Ou use o script SQL inline que será gerado automaticamente")

    return sql
  } catch (error) {
    console.error("\n💥 Erro durante o processamento:", error)
  }
}

// Executar script
main()
