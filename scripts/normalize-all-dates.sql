-- Script para normalizar TODAS as datas para 09/08/2023 se você quiser
-- (baseado no que você mencionou que todas deveriam ser dessa data)

-- Primeiro, verificar as datas atuais
SELECT 
  symbol,
  date,
  COUNT(*) as quantidade
FROM transactions 
GROUP BY symbol, date
ORDER BY date, symbol;

-- Se você quiser que TODAS as transações sejam de 09/08/2023:
UPDATE transactions 
SET 
  date = '2023-08-09',
  updated_at = NOW();

-- Ou se quiser corrigir baseado na data de criação:
-- UPDATE transactions 
-- SET 
--   date = created_at::date,
--   updated_at = NOW();

-- Verificar resultado final
SELECT 
  date,
  COUNT(*) as total_transacoes
FROM transactions 
GROUP BY date
ORDER BY date;

-- Mostrar todas as transações com suas datas
SELECT 
  symbol,
  company_name,
  type,
  quantity,
  price,
  date,
  created_at
FROM transactions 
ORDER BY date DESC, created_at DESC;
