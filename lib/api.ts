// Tipos para os dados das ações
export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  dividendYield: number
  sector: string
}

export interface IbovespaData {
  price: number
  change: number
  changePercent: number
}

// Dados base das empresas (preços reais como referência)
const stocksDatabase = [
  {
    symbol: "VALE3",
    name: "Vale S.A.",
    basePrice: 65.42,
    sector: "Mineração",
    marketCap: 312500000000,
    pe: 4.2,
    dividendYield: 8.5,
    volatility: 0.03, // 3% de volatilidade
  },
  {
    symbol: "ITUB4",
    name: "Itaú Unibanco Holding S.A.",
    basePrice: 32.18,
    sector: "Bancos",
    marketCap: 298700000000,
    pe: 9.1,
    dividendYield: 6.2,
    volatility: 0.025,
  },
  {
    symbol: "BBAS3",
    name: "Banco do Brasil S.A.",
    basePrice: 28.95,
    sector: "Bancos",
    marketCap: 156300000000,
    pe: 7.8,
    dividendYield: 7.1,
    volatility: 0.028,
  },
  {
    symbol: "PETR4",
    name: "Petróleo Brasileiro S.A.",
    basePrice: 38.42,
    sector: "Petróleo",
    marketCap: 501200000000,
    pe: 3.1,
    dividendYield: 12.3,
    volatility: 0.04,
  },
  {
    symbol: "MGLU3",
    name: "Magazine Luiza S.A.",
    basePrice: 8.95,
    sector: "Varejo",
    marketCap: 59800000000,
    pe: 15.2,
    dividendYield: 0.0,
    volatility: 0.06,
  },
  {
    symbol: "ABEV3",
    name: "Ambev S.A.",
    basePrice: 11.84,
    sector: "Bebidas",
    marketCap: 186400000000,
    pe: 12.5,
    dividendYield: 4.8,
    volatility: 0.02,
  },
]

// Função para gerar variação realista baseada em horário
function generateRealisticVariation(baseVolatility: number): number {
  const hour = new Date().getHours()
  const minute = new Date().getMinutes()

  // Maior volatilidade na abertura (9-11h) e fechamento (16-18h)
  let timeMultiplier = 1
  if ((hour >= 9 && hour <= 11) || (hour >= 16 && hour <= 18)) {
    timeMultiplier = 1.5
  } else if (hour >= 12 && hour <= 15) {
    timeMultiplier = 0.8 // Menor volatilidade no meio do dia
  }

  // Usa distribuição normal aproximada
  const random1 = Math.random()
  const random2 = Math.random()
  const normalRandom = Math.sqrt(-2 * Math.log(random1)) * Math.cos(2 * Math.PI * random2)

  return normalRandom * baseVolatility * timeMultiplier
}

// Função principal para buscar dados das ações
export async function fetchStockData(): Promise<StockQuote[]> {
  // Simula delay de API real
  await new Promise((resolve) => setTimeout(resolve, 800))

  return stocksDatabase.map((stock) => {
    const variation = generateRealisticVariation(stock.volatility)
    const newPrice = stock.basePrice * (1 + variation)
    const change = newPrice - stock.basePrice
    const changePercent = (change / stock.basePrice) * 100

    // Volume realista baseado no market cap
    const baseVolume = Math.floor(stock.marketCap / 10000000000) * 5000000
    const volumeVariation = Math.random() * 0.5 + 0.75 // 75% a 125% do volume base
    const volume = Math.floor(baseVolume * volumeVariation)

    return {
      symbol: stock.symbol,
      name: stock.name,
      price: Number(newPrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: volume,
      marketCap: stock.marketCap,
      pe: stock.pe,
      dividendYield: stock.dividendYield,
      sector: stock.sector,
    }
  })
}

// Função para buscar dados do Ibovespa
export async function fetchIbovespaData(): Promise<IbovespaData> {
  // Simula delay de API
  await new Promise((resolve) => setTimeout(resolve, 600))

  const basePrice = 126847
  const variation = generateRealisticVariation(0.015) // 1.5% volatilidade para índice
  const newPrice = basePrice * (1 + variation)
  const change = newPrice - basePrice

  return {
    price: Math.round(newPrice),
    change: Math.round(change),
    changePercent: Number(((change / basePrice) * 100).toFixed(2)),
  }
}

// Função para simular dados históricos (para futuros gráficos)
export function generateHistoricalData(symbol: string, days = 30) {
  const stock = stocksDatabase.find((s) => s.symbol === symbol)
  if (!stock) return []

  const data = []
  let currentPrice = stock.basePrice

  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    // Variação diária menor para dados históricos
    const variation = generateRealisticVariation(stock.volatility * 0.7)
    currentPrice = currentPrice * (1 + variation)

    data.push({
      date: date.toISOString().split("T")[0],
      price: Number(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000) + 5000000,
    })
  }

  return data
}
