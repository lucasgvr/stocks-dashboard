-- Verificar transações existentes no banco
SELECT 
  COUNT(*) as total_transacoes,
  COUNT(DISTINCT symbol) as total_acoes,
  MIN(date) as primeira_transacao,
  MAX(date) as ultima_transacao
FROM transactions;
