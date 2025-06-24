-- Script para inserir as transações do CSV
-- Execute este script após rodar o processamento do CSV

-- Primeiro, vamos verificar se há transações existentes
SELECT COUNT(*) as transacoes_existentes FROM transactions;

-- Inserir transações do CSV (será preenchido automaticamente após processar o arquivo)
-- As transações serão inseridas aqui baseadas no processamento do arquivo CSV

-- Verificar transações inseridas
SELECT 
  symbol,
  company_name,
  type,
  quantity,
  price,
  total,
  date,
  created_at
FROM transactions 
ORDER BY created_at DESC, date DESC
LIMIT 20;

-- Resumo por ação
SELECT 
  symbol,
  company_name,
  COUNT(*) as total_transacoes,
  SUM(CASE WHEN type = 'buy' THEN quantity ELSE 0 END) as acoes_compradas,
  SUM(CASE WHEN type = 'sell' THEN quantity ELSE 0 END) as acoes_vendidas,
  SUM(CASE WHEN type = 'buy' THEN total ELSE 0 END) as valor_compras,
  SUM(CASE WHEN type = 'sell' THEN total ELSE 0 END) as valor_vendas
FROM transactions 
GROUP BY symbol, company_name
ORDER BY symbol;
