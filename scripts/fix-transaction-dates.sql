-- Corrigir datas das transações existentes (adicionar 1 dia)
UPDATE transactions 
SET date = date + INTERVAL '1 day'
WHERE date < CURRENT_DATE;

-- Verificar as datas corrigidas
SELECT 
  id,
  symbol,
  company_name,
  type,
  date,
  created_at
FROM transactions 
ORDER BY date DESC, symbol
LIMIT 20;

-- Resumo das datas por mês
SELECT 
  DATE_TRUNC('month', date) as mes,
  COUNT(*) as total_transacoes
FROM transactions 
GROUP BY DATE_TRUNC('month', date)
ORDER BY mes DESC;
