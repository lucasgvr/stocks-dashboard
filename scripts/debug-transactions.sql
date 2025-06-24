-- Verificar se as transações foram inseridas
SELECT COUNT(*) as total_transacoes FROM transactions;

-- Ver as últimas transações inseridas
SELECT 
  id,
  symbol,
  company_name,
  type,
  quantity,
  price,
  total,
  date,
  created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar se há dados na tabela
SELECT 
  symbol,
  COUNT(*) as quantidade_transacoes,
  MIN(date) as primeira_data,
  MAX(date) as ultima_data
FROM transactions 
GROUP BY symbol
ORDER BY symbol;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;
