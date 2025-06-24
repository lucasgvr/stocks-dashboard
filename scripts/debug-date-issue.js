// Script para debugar o problema das datas
console.log("🔍 Debugando problema das datas...")

// Simular o que acontece no JavaScript
function debugDateHandling() {
  console.log("\n📅 Testando manipulação de datas:")

  const now = new Date()
  console.log("1. Data atual (new Date()):", now)
  console.log("2. toString():", now.toString())
  console.log("3. toISOString():", now.toISOString())
  console.log("4. toDateString():", now.toDateString())

  // Método atual (problemático)
  const currentMethod = now.toISOString().split("T")[0]
  console.log("5. Método atual (toISOString().split('T')[0]):", currentMethod)

  // Método correto
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const correctMethod = `${year}-${month}-${day}`
  console.log("6. Método correto (getFullYear/getMonth/getDate):", correctMethod)

  console.log("\n🕐 Informações de timezone:")
  console.log("Timezone offset (minutos):", now.getTimezoneOffset())
  console.log("Timezone offset (horas):", now.getTimezoneOffset() / 60)

  // Testar input date
  console.log("\n📝 Testando input type='date':")
  const inputValue = "2023-08-09"
  const dateFromInput = new Date(inputValue)
  console.log("Input value:", inputValue)
  console.log("new Date(inputValue):", dateFromInput)
  console.log("dateFromInput.toISOString():", dateFromInput.toISOString())

  // Método correto para input date
  const [inputYear, inputMonth, inputDay] = inputValue.split("-").map(Number)
  const correctDate = new Date(inputYear, inputMonth - 1, inputDay)
  console.log("Método correto para input:", correctDate)
  console.log(
    "Volta para string:",
    `${correctDate.getFullYear()}-${String(correctDate.getMonth() + 1).padStart(2, "0")}-${String(correctDate.getDate()).padStart(2, "0")}`,
  )
}

// Executar debug
debugDateHandling()

console.log("\n💡 Conclusão:")
console.log("- O problema está na conversão automática para UTC")
console.log("- Usar getFullYear(), getMonth(), getDate() resolve")
console.log("- Evitar toISOString() para datas locais")
console.log("- Input type='date' deve ser tratado como data local")
