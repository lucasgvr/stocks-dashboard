"use client"

import { useEffect, useState } from "react"
import { Wallet, TrendingUp, History, Grid3X3, List } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { getTransactions, checkSupabaseConnection, getStockPrices, getFairPrices } from "@/lib/supabase"
import { getTransactionsLocal, getStockPricesLocal, getFairPricesLocal } from "@/lib/local-storage"
import { calculatePositions, calculateAllPositions, formatCurrency, type CalculatedPosition } from "@/lib/portfolio"
import { PortfolioCard } from "@/components/portfolio-card"
import { PortfolioListView } from "@/components/portfolio-list-view"
import { TransactionModal } from "@/components/transaction-modal"
import { TransactionsDialog } from "@/components/transactions-dialog"
import { PriceEditDialog } from "@/components/price-edit-dialog"
import { FairPriceDialog } from "@/components/fair-price-dialog"
import { useToast } from "@/hooks/use-toast"
import { CorporateEventModal } from "@/components/corporate-event-modal"

export default function PortfolioApp() {
  const [activePositions, setActivePositions] = useState<CalculatedPosition[]>([])
  const [allPositions, setAllPositions] = useState<CalculatedPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosition, setSelectedPosition] = useState<CalculatedPosition | null>(null)
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false)
  const [priceEditDialogOpen, setPriceEditDialogOpen] = useState(false)
  const [fairPriceDialogOpen, setFairPriceDialogOpen] = useState(false)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { toast } = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      let transactions: any[] = []
      let stockPricesMap: { [symbol: string]: number } = {}
      let fairPricesMap: { [symbol: string]: number } = {}

      if (useLocalStorage) {
        transactions = getTransactionsLocal()
        const stockPrices = getStockPricesLocal()
        const fairPrices = getFairPricesLocal()

        stockPricesMap = stockPrices.reduce(
          (acc, price) => {
            acc[price.symbol] = price.current_price
            return acc
          },
          {} as { [symbol: string]: number },
        )

        fairPricesMap = fairPrices.reduce(
          (acc, price) => {
            acc[price.symbol] = price.fair_price
            return acc
          },
          {} as { [symbol: string]: number },
        )
      } else {
        try {
          const isConnected = await checkSupabaseConnection()
          if (isConnected) {
            transactions = await getTransactions()
            const stockPrices = await getStockPrices()
            const fairPrices = await getFairPrices()

            stockPricesMap = stockPrices.reduce(
              (acc, price) => {
                acc[price.symbol] = price.current_price
                return acc
              },
              {} as { [symbol: string]: number },
            )

            fairPricesMap = fairPrices.reduce(
              (acc, price) => {
                acc[price.symbol] = price.fair_price
                return acc
              },
              {} as { [symbol: string]: number },
            )
          } else {
            throw new Error("Supabase não disponível")
          }
        } catch (error) {
          console.log("Usando localStorage como fallback")
          setUseLocalStorage(true)
          transactions = getTransactionsLocal()
          const stockPrices = getStockPricesLocal()
          const fairPrices = getFairPricesLocal()

          stockPricesMap = stockPrices.reduce(
            (acc, price) => {
              acc[price.symbol] = price.current_price
              return acc
            },
            {} as { [symbol: string]: number },
          )

          fairPricesMap = fairPrices.reduce(
            (acc, price) => {
              acc[price.symbol] = price.fair_price
              return acc
            },
            {} as { [symbol: string]: number },
          )

          toast({
            title: "Modo Offline",
            description: "Usando armazenamento local. Configure o Supabase para sincronização.",
            variant: "destructive",
          })
        }
      }

      const calculatedActivePositions = calculatePositions(transactions, stockPricesMap, fairPricesMap)
      const calculatedAllPositions = calculateAllPositions(transactions, stockPricesMap, fairPricesMap)

      setActivePositions(calculatedActivePositions)
      setAllPositions(calculatedAllPositions)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Verifique sua conexão.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [useLocalStorage])

  const handleViewTransactions = (position: CalculatedPosition) => {
    setSelectedPosition(position)
    setTransactionsDialogOpen(true)
  }

  const handleEditPrice = (position: CalculatedPosition) => {
    setSelectedPosition(position)
    setPriceEditDialogOpen(true)
  }

  const handleCalculateFairPrice = (position: CalculatedPosition) => {
    setSelectedPosition(position)
    setFairPriceDialogOpen(true)
  }

  const handleTransactionsDialogChange = (open: boolean) => {
    setTransactionsDialogOpen(open)
    if (!open) {
      setSelectedPosition(null)
    }
  }

  const handlePriceDialogChange = (open: boolean) => {
    setPriceEditDialogOpen(open)
    if (!open) {
      setSelectedPosition(null)
    }
  }

  const handleFairPriceDialogChange = (open: boolean) => {
    setFairPriceDialogOpen(open)
    if (!open) {
      setSelectedPosition(null)
    }
  }

  const handlePriceUpdate = () => {
    loadData()
    setPriceEditDialogOpen(false)
    setSelectedPosition(null)
  }

  const handleFairPriceUpdate = () => {
    loadData()
    setFairPriceDialogOpen(false)
    setSelectedPosition(null)
  }

  const handleTransactionDeleted = () => {
    loadData()
  }

  // Cálculos do portfólio (apenas posições ativas)
  const totalInvested = activePositions.reduce((sum, pos) => sum + pos.total_invested, 0)
  const totalCurrentValue = activePositions.reduce((sum, pos) => sum + (pos.current_value || pos.total_invested), 0)
  const totalProfitLoss = totalCurrentValue - totalInvested
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0
  const totalDividends12m = activePositions.reduce((sum, pos) => sum + pos.dividends_received_12m, 0)
  const portfolioDividendYield = totalInvested > 0 ? (totalDividends12m / totalInvested) * 100 : 0

  const LoadingCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const EmptyState = ({ isAllTab = false }) => (
    <Card>
      <CardContent className="p-12 text-center">
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {isAllTab ? "Nenhuma transação encontrada" : "Sua carteira está vazia"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {isAllTab
            ? "Você ainda não fez nenhuma transação"
            : "Comece adicionando suas primeiras transações de compra, venda ou dividendos"}
        </p>
        <TransactionModal onTransactionAdded={loadData} useLocalStorage={useLocalStorage} />
      </CardContent>
    </Card>
  )

  const renderPositions = (positions: CalculatedPosition[]) => {
    if (loading) return <LoadingCards />
    if (positions.length === 0) return <EmptyState />

    if (viewMode === "list") {
      return (
        <PortfolioListView
          positions={positions}
          onViewTransactions={handleViewTransactions}
          onEditPrice={handleEditPrice}
          onCalculateFairPrice={handleCalculateFairPrice}
          useLocalStorage={useLocalStorage}
        />
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {positions.map((position) => (
          <PortfolioCard
            key={position.symbol}
            position={position}
            onViewTransactions={handleViewTransactions}
            onEditPrice={handleEditPrice}
            onCalculateFairPrice={handleCalculateFairPrice}
            useLocalStorage={useLocalStorage}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-800 p-4 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4 relative">
            <Wallet className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Minha Carteira</h1>
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <TransactionModal onTransactionAdded={loadData} useLocalStorage={useLocalStorage} />
            <CorporateEventModal onEventAdded={loadData} useLocalStorage={useLocalStorage} />
          </div>
        </div>

        {/* Alert para modo local */}
        {useLocalStorage && (
          <Alert>
            <AlertDescription>
              Executando em modo local. Para sincronização na nuvem, configure as variáveis de ambiente do Supabase:
              <br />
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </AlertDescription>
          </Alert>
        )}

        {/* Portfolio Summary (apenas para posições ativas) */}
        {activePositions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Investido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lucro/Prejuízo</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${totalProfitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {totalProfitLoss >= 0 ? "+" : ""}
                  {formatCurrency(totalProfitLoss)}
                </div>
                <div
                  className={`text-sm ${totalProfitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {totalProfitLoss >= 0 ? "+" : ""}
                  {totalProfitLossPercent.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dividendos 12m</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalDividends12m)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Dividend Yield</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioDividendYield.toFixed(2)}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs para Carteira Ativa e Todas as Transações */}
        <Tabs defaultValue="active" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Carteira Ativa ({activePositions.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Todas as Transações ({allPositions.length})
              </TabsTrigger>
            </TabsList>

            {/* Toggle de visualização */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Cards
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
            </div>
          </div>

          <TabsContent value="active" className="mt-6">
            {renderPositions(activePositions)}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {loading ? (
              <LoadingCards />
            ) : allPositions.length === 0 ? (
              <EmptyState isAllTab />
            ) : viewMode === "list" ? (
              <PortfolioListView
                positions={allPositions}
                onViewTransactions={handleViewTransactions}
                onEditPrice={handleEditPrice}
                onCalculateFairPrice={handleCalculateFairPrice}
                useLocalStorage={useLocalStorage}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allPositions.map((position) => (
                  <PortfolioCard
                    key={position.symbol}
                    position={position}
                    onViewTransactions={handleViewTransactions}
                    onEditPrice={handleEditPrice}
                    onCalculateFairPrice={handleCalculateFairPrice}
                    useLocalStorage={useLocalStorage}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs - Sempre renderizados */}
        <TransactionsDialog
          position={selectedPosition}
          open={transactionsDialogOpen}
          onOpenChange={handleTransactionsDialogChange}
          onTransactionDeleted={handleTransactionDeleted}
          useLocalStorage={useLocalStorage}
        />

        <PriceEditDialog
          position={selectedPosition}
          open={priceEditDialogOpen}
          onOpenChange={handlePriceDialogChange}
          onPriceUpdate={handlePriceUpdate}
          useLocalStorage={useLocalStorage}
        />

        <FairPriceDialog
          position={selectedPosition}
          open={fairPriceDialogOpen}
          onOpenChange={handleFairPriceDialogChange}
          onFairPriceUpdate={handleFairPriceUpdate}
          useLocalStorage={useLocalStorage}
        />
      </div>
    </div>
  )
}
