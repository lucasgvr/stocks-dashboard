-- Criar tabela de preços das ações
CREATE TABLE IF NOT EXISTS stock_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  current_price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol ON stock_prices(symbol);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_stock_prices_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_stock_prices_updated_at 
    BEFORE UPDATE ON stock_prices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_stock_prices_updated_at_column();

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Enable all operations for authenticated users on stock_prices" ON stock_prices
    FOR ALL USING (true);
