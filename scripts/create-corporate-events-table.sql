-- Criar tabela de eventos corporativos
CREATE TABLE IF NOT EXISTS corporate_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('split', 'reverse_split', 'bonus', 'merger', 'spinoff')),
  event_date DATE NOT NULL,
  
  -- Para splits e grupamentos
  ratio_from INTEGER DEFAULT NULL, -- Ex: 1 ação vira...
  ratio_to INTEGER DEFAULT NULL,   -- Ex: 2 ações (split 1:2)
  
  -- Para fusões e incorporações
  new_symbol VARCHAR(10) DEFAULT NULL,
  new_company_name VARCHAR(255) DEFAULT NULL,
  cash_per_share DECIMAL(10,2) DEFAULT 0,
  new_shares_per_old DECIMAL(10,4) DEFAULT 0,
  
  -- Para bonificações
  bonus_shares_per_old DECIMAL(10,4) DEFAULT 0,
  
  -- Metadados
  description TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_corporate_events_symbol ON corporate_events(symbol);
CREATE INDEX IF NOT EXISTS idx_corporate_events_date ON corporate_events(event_date);
CREATE INDEX IF NOT EXISTS idx_corporate_events_type ON corporate_events(event_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_corporate_events_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_corporate_events_updated_at 
    BEFORE UPDATE ON corporate_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_corporate_events_updated_at_column();

-- RLS
ALTER TABLE corporate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for authenticated users on corporate_events" ON corporate_events
    FOR ALL USING (true);
