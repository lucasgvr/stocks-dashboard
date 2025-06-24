-- Inserir transações do arquivo CSV
-- Baseado nos dados: Data, Ticker, Quantidade, Preço, Empresa, Compra/Venda

INSERT INTO transactions (symbol, company_name, type, quantity, price, total, date, created_at, updated_at)
VALUES
  ('BBAS3', 'Banco do Brasil', 'buy', 10, 25.80, 258.00, '2025-05-16', NOW(), NOW()),
  ('VALE3', 'Vale S.A.', 'buy', 15, 62.45, 936.75, '2025-05-15', NOW(), NOW()),
  ('ITUB4', 'Itaú Unibanco', 'buy', 20, 32.10, 642.00, '2025-05-14', NOW(), NOW()),
  ('PETR4', 'Petrobras', 'buy', 12, 38.90, 466.80, '2025-05-13', NOW(), NOW()),
  ('MGLU3', 'Magazine Luiza', 'buy', 50, 8.75, 437.50, '2025-05-12', NOW(), NOW()),
  ('ABEV3', 'Ambev', 'buy', 25, 11.60, 290.00, '2025-05-11', NOW(), NOW()),
  ('WEGE3', 'WEG', 'buy', 8, 45.30, 362.40, '2025-05-10', NOW(), NOW()),
  ('RENT3', 'Localiza', 'buy', 18, 55.20, 993.60, '2025-05-09', NOW(), NOW()),
  ('BBAS3', 'Banco do Brasil', 'buy', 5, 26.10, 130.50, '2025-05-08', NOW(), NOW()),
  ('VALE3', 'Vale S.A.', 'sell', 5, 64.20, 321.00, '2025-05-07', NOW(), NOW()),
  ('ITUB4', 'Itaú Unibanco', 'buy', 10, 31.85, 318.50, '2025-05-06', NOW(), NOW()),
  ('PETR4', 'Petrobras', 'dividend', 0, 2.50, 2.50, '2025-05-05', NOW(), NOW()),
  ('VALE3', 'Vale S.A.', 'dividend', 0, 3.20, 3.20, '2025-05-04', NOW(), NOW()),
  ('BBAS3', 'Banco do Brasil', 'dividend', 0, 1.80, 1.80, '2025-05-03', NOW(), NOW()),
  ('MGLU3', 'Magazine Luiza', 'sell', 20, 9.10, 182.00, '2025-05-02', NOW(), NOW()),
  ('ABEV3', 'Ambev', 'buy', 15, 11.45, 171.75, '2025-05-01', NOW(), NOW()),
  ('WEGE3', 'WEG', 'dividend', 0, 1.25, 1.25, '2025-04-30', NOW(), NOW()),
  ('RENT3', 'Localiza', 'buy', 7, 54.80, 383.60, '2025-04-29', NOW(), NOW()),
  ('ITUB4', 'Itaú Unibanco', 'dividend', 0, 0.85, 0.85, '2025-04-28', NOW(), NOW()),
  ('PETR4', 'Petrobras', 'buy', 8, 39.20, 313.60, '2025-04-27', NOW(), NOW());

-- Verificar se as transações foram inseridas
SELECT 
  COUNT(*) as total_inserido,
  COUNT(DISTINCT symbol) as acoes_diferentes,
  MIN(date) as primeira_data,
  MAX(date) as ultima_data
FROM transactions
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Mostrar resumo por ação
SELECT 
  symbol,
  company_name,
  COUNT(*) as total_transacoes,
  SUM(CASE WHEN type = 'buy' THEN quantity ELSE 0 END) as acoes_compradas,
  SUM(CASE WHEN type = 'sell' THEN quantity ELSE 0 END) as acoes_vendidas,
  COUNT(CASE WHEN type = 'dividend' THEN 1 END) as dividendos_recebidos,
  SUM(CASE WHEN type = 'buy' THEN total ELSE 0 END) as valor_investido,
  SUM(CASE WHEN type = 'sell' THEN total ELSE 0 END) as valor_vendido,
  SUM(CASE WHEN type = 'dividend' THEN total ELSE 0 END) as dividendos_valor
FROM transactions 
GROUP BY symbol, company_name
ORDER BY symbol;
