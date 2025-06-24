// Script para testar se as datas estão sendo salvas corretamente
console.log("🧪 Testando correção de datas...")

// Função para obter data atual no formato correto
function getCurrentDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Função para simular criação de transação
function simulateTransactionCreation() {
  const today = getCurrentDateString()
  console.log(`📅 Data de hoje: ${today}`)

  // Simular dados da transação
  const transactionData = {
    symbol: "TEST3",
    company_name: "Teste S.A.",
    type: "buy",
    quantity: 100,
    price: 10.5,
    total: 1050.0,
    date: today,
  }

  console.log("📝 Dados da transação:")
  console.log(JSON.stringify(transactionData, null, 2))

  // Verificar se a data está correta
  const inputDate = new Date(today + "T00:00:00")
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  console.log(`🔍 Data do input: ${inputDate.toDateString()}`)
  console.log(`🔍 Data de hoje: ${todayDate.toDateString()}`)
  console.log(`✅ Datas coincidem: ${inputDate.getTime() === todayDate.getTime()}`)

  return transactionData
}

// Executar teste
simulateTransactionCreation()

console.log("\n💡 Para testar:")
console.log("1. Execute este script")
console.log("2. Adicione uma nova transação na aplicação")
console.log("3. Verifique se a data está correta")
console.log("4. Execute o script SQL de correção se necessário")
