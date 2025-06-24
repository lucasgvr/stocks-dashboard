-- Script mais robusto para corrigir todas as datas
-- Primeiro, vamos ver as datas atuais
SELECT 
  id,
  symbol,
  date,
  date + INTERVAL '1 day' as data_corrigida,
  created_at
FROM transactions 
ORDER BY created_at DESC
LIMIT 10;

-- Corrigir TODAS as transações que estão com data anterior
-- (assumindo que todas precisam de +1 dia)
UPDATE transactions 
SET 
  date = date + INTERVAL '1 day',
  updated_at = NOW()
WHERE date IS NOT NULL;

-- Verificar o resultado
SELECT 
  COUNT(*) as total_corrigido,
  MIN(date) as primeira_data,
  MAX(date) as ultima_data
FROM transactions;

-- Ver as últimas transações corrigidas
SELECT 
  id,
  symbol,
  company_name,
  type,
  date,
  created_at
FROM transactions 
ORDER BY created_at DESC
LIMIT 10;
