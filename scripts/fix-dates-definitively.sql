-- Script definitivo para corrigir todas as datas
-- Primeiro, vamos analisar o problema atual

SELECT 
  id,
  symbol,
  date,
  date::text as date_string,
  EXTRACT(EPOCH FROM date) as timestamp_epoch,
  created_at,
  created_at::date as created_date
FROM transactions 
ORDER BY created_at DESC
LIMIT 10;

-- Verificar diferenças entre data da transação e data de criação
SELECT 
  symbol,
  date,
  created_at::date as created_date,
  CASE 
    WHEN date < created_at::date THEN 'Data anterior ao criado'
    WHEN date = created_at::date THEN 'Data igual ao criado'
    WHEN date > created_at::date THEN 'Data posterior ao criado'
  END as status
FROM transactions 
ORDER BY created_at DESC;

-- Corrigir todas as transações que têm data anterior à data de criação
UPDATE transactions 
SET 
  date = created_at::date,
  updated_at = NOW()
WHERE date < created_at::date;

-- Verificar resultado
SELECT 
  COUNT(*) as total_corrigidas
FROM transactions 
WHERE date = created_at::date;

-- Mostrar últimas transações após correção
SELECT 
  id,
  symbol,
  company_name,
  type,
  date,
  created_at::date as created_date,
  CASE 
    WHEN date = created_at::date THEN '✅ Correto'
    ELSE '❌ Ainda com problema'
  END as status
FROM transactions 
ORDER BY created_at DESC
LIMIT 10;
