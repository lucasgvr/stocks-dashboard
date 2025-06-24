-- Criar tabela de preços justos das ações
CREATE TABLE IF NOT EXISTS fair_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  fair_price DECIMAL(10,2) NOT NULL,
  years_analyzed INTEGER NOT NULL,
  average_dividend DECIMAL(10,2) NOT NULL,
  dividend_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_fair_prices_symbol ON fair_prices(symbol);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_fair_prices_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_fair_prices_updated_at 
    BEFORE UPDATE ON fair_prices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_fair_prices_updated_at_column();

-- Habilitar RLS (Row Level Security) se necessário
ALTER TABLE fair_prices ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Enable all operations for authenticated users on fair_prices" ON fair_prices
    FOR ALL USING (true);
