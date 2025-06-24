// Script para processar CSV e gerar SQL de inserção
async function processCSVAndGenerateSQL() {
  try {
    console.log("📥 Buscando e processando arquivo CSV...")

    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Control%20-%20P%C3%A1gina13-gwUXxfGTZRaDHex903H26OasET2KdY.csv",
    )

    if (!response.ok) {
      throw new Error(`Erro ao buscar CSV: ${response.status}`)
    }

    const csvText = await response.text()
    console.log("✅ Arquivo CSV carregado")

    // Processar CSV
    const lines = csvText.trim().split("\n")
    console.log(`📊 Total de linhas: ${lines.length}`)

    const transactions = []

    // Pular cabeçalho e processar dados
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Dividir por vírgula, considerando aspas
      const values = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ""))
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ""))

      if (values.length >= 6) {
        const [data, ticker, quantidade, preco, empresa, tipo] = values

        try {
          // Converter data DD/MM/YYYY para YYYY-MM-DD
          const [day, month, year] = data.split("/")
          const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`

          // Limpar preço
          const cleanPrice = Number.parseFloat(preco.replace(/[R$\s]/g, "").replace(",", "."))

          // Limpar quantidade
          const qty = Number.parseInt(quantidade.replace(/\D/g, ""))

          // Tipo de transação
          const transactionType = tipo.toLowerCase().includes("compra") ? "buy" : "sell"

          if (!isNaN(cleanPrice) && !isNaN(qty) && qty > 0 && cleanPrice > 0) {
            transactions.push({
              symbol: ticker.toUpperCase().trim(),
              company_name: empresa.trim(),
              type: transactionType,
              quantity: qty,
              price: cleanPrice,
              total: qty * cleanPrice,
              date: formattedDate,
            })

            console.log(`✓ ${ticker}: ${tipo} ${qty} ações a R$ ${cleanPrice.toFixed(2)} em ${data}`)
          }
        } catch (error) {
          console.log(`⚠️ Erro na linha ${i}: ${error.message}`)
        }
      }
    }

    console.log(`\n📈 Total processado: ${transactions.length} transações`)

    // Mostrar resumo
    const summary = {}
    transactions.forEach((t) => {
      if (!summary[t.symbol]) summary[t.symbol] = { compras: 0, vendas: 0 }
      if (t.type === "buy") summary[t.symbol].compras++
      else summary[t.symbol].vendas++
    })

    console.log("\n📊 Resumo por ação:")
    Object.entries(summary).forEach(([symbol, data]) => {
      console.log(`   ${symbol}: ${data.compras} compras, ${data.vendas} vendas`)
    })

    return transactions
  } catch (error) {
    console.error("❌ Erro:", error)
    return []
  }
}

// Executar processamento
processCSVAndGenerateSQL()
