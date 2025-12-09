-- Migration COMPLETA: Todas as colunas necessárias para a tabela anamneses
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- =====================================================
-- COLUNAS DE CONSENTIMENTO (OBRIGATÓRIAS)
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'aceite_contraindicacoes') THEN
        ALTER TABLE anamneses ADD COLUMN aceite_contraindicacoes BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'aceite_livre_vontade') THEN
        ALTER TABLE anamneses ADD COLUMN aceite_livre_vontade BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'aceite_termo_responsabilidade') THEN
        ALTER TABLE anamneses ADD COLUMN aceite_termo_responsabilidade BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;

-- =====================================================
-- COLUNAS DE CONTATO DE EMERGÊNCIA
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'nome_contato_emergencia') THEN
        ALTER TABLE anamneses ADD COLUMN nome_contato_emergencia TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'parentesco_contato') THEN
        ALTER TABLE anamneses ADD COLUMN parentesco_contato TEXT;
    END IF;
END $$;

-- =====================================================
-- COLUNAS DE SAÚDE
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'sem_doencas') THEN
        ALTER TABLE anamneses ADD COLUMN sem_doencas BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'problemas_respiratorios') THEN
        ALTER TABLE anamneses ADD COLUMN problemas_respiratorios BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'problemas_renais') THEN
        ALTER TABLE anamneses ADD COLUMN problemas_renais BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'problemas_hepaticos') THEN
        ALTER TABLE anamneses ADD COLUMN problemas_hepaticos BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'transtorno_psiquiatrico') THEN
        ALTER TABLE anamneses ADD COLUMN transtorno_psiquiatrico BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'transtorno_psiquiatrico_qual') THEN
        ALTER TABLE anamneses ADD COLUMN transtorno_psiquiatrico_qual TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'gestante_lactante') THEN
        ALTER TABLE anamneses ADD COLUMN gestante_lactante BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'tipo_antidepressivo') THEN
        ALTER TABLE anamneses ADD COLUMN tipo_antidepressivo TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'cirurgias_recentes') THEN
        ALTER TABLE anamneses ADD COLUMN cirurgias_recentes TEXT;
    END IF;
END $$;

-- =====================================================
-- COLUNAS DE SUBSTÂNCIAS
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'sem_vicios') THEN
        ALTER TABLE anamneses ADD COLUMN sem_vicios BOOLEAN DEFAULT false;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'tabaco_frequencia') THEN
        ALTER TABLE anamneses ADD COLUMN tabaco_frequencia TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'alcool_frequencia') THEN
        ALTER TABLE anamneses ADD COLUMN alcool_frequencia TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'cannabis') THEN
        ALTER TABLE anamneses ADD COLUMN cannabis BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- COLUNAS DE EXPERIÊNCIA
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'quantas_vezes_consagrou') THEN
        ALTER TABLE anamneses ADD COLUMN quantas_vezes_consagrou TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anamneses' AND column_name = 'restricao_alimentar') THEN
        ALTER TABLE anamneses ADD COLUMN restricao_alimentar TEXT;
    END IF;
END $$;

-- =====================================================
-- ATUALIZAR REGISTROS EXISTENTES
-- =====================================================

UPDATE anamneses SET aceite_contraindicacoes = true WHERE aceite_contraindicacoes IS NULL;
UPDATE anamneses SET aceite_livre_vontade = true WHERE aceite_livre_vontade IS NULL;
UPDATE anamneses SET aceite_termo_responsabilidade = true WHERE aceite_termo_responsabilidade IS NULL;
UPDATE anamneses SET sem_doencas = false WHERE sem_doencas IS NULL;
UPDATE anamneses SET problemas_respiratorios = false WHERE problemas_respiratorios IS NULL;
UPDATE anamneses SET problemas_renais = false WHERE problemas_renais IS NULL;
UPDATE anamneses SET problemas_hepaticos = false WHERE problemas_hepaticos IS NULL;
UPDATE anamneses SET transtorno_psiquiatrico = false WHERE transtorno_psiquiatrico IS NULL;
UPDATE anamneses SET gestante_lactante = false WHERE gestante_lactante IS NULL;
UPDATE anamneses SET sem_vicios = false WHERE sem_vicios IS NULL;
UPDATE anamneses SET cannabis = false WHERE cannabis IS NULL;
