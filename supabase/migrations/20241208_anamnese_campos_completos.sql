-- Migration: Adicionar campos completos na tabela anamneses
-- Esta migration adiciona novos campos para uma ficha de anamnese mais completa

-- =====================================================
-- NOVOS CAMPOS DE CONTATO DE EMERGÊNCIA
-- =====================================================

-- Nome do contato de emergência
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'nome_contato_emergencia'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN nome_contato_emergencia TEXT;
    END IF;
END $$;

-- Parentesco/relação com o contato
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'parentesco_contato'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN parentesco_contato TEXT;
    END IF;
END $$;

-- =====================================================
-- CAMPOS DE SAÚDE - OPÇÃO DE NEGAR E NOVOS CAMPOS
-- =====================================================

-- Opção "Não possuo doenças"
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'sem_doencas'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN sem_doencas BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Problemas respiratórios
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'problemas_respiratorios'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN problemas_respiratorios BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Problemas renais
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'problemas_renais'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN problemas_renais BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Problemas hepáticos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'problemas_hepaticos'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN problemas_hepaticos BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Transtorno psiquiátrico
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'transtorno_psiquiatrico'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN transtorno_psiquiatrico BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Qual transtorno psiquiátrico
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'transtorno_psiquiatrico_qual'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN transtorno_psiquiatrico_qual TEXT;
    END IF;
END $$;

-- Gestante ou lactante
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'gestante_lactante'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN gestante_lactante BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Tipo de antidepressivo
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'tipo_antidepressivo'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN tipo_antidepressivo TEXT;
    END IF;
END $$;

-- Cirurgias recentes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'cirurgias_recentes'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN cirurgias_recentes TEXT;
    END IF;
END $$;

-- =====================================================
-- CAMPOS DE SUBSTÂNCIAS - OPÇÃO DE NEGAR E FREQUÊNCIA
-- =====================================================

-- Opção "Não faço uso de substâncias"
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'sem_vicios'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN sem_vicios BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Frequência de tabaco
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'tabaco_frequencia'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN tabaco_frequencia TEXT;
    END IF;
END $$;

-- Frequência de álcool
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'alcool_frequencia'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN alcool_frequencia TEXT;
    END IF;
END $$;

-- Cannabis
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'cannabis'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN cannabis BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- CAMPOS DE EXPERIÊNCIA
-- =====================================================

-- Quantas vezes já consagrou
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'quantas_vezes_consagrou'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN quantas_vezes_consagrou TEXT;
    END IF;
END $$;

-- Restrição alimentar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anamneses' 
        AND column_name = 'restricao_alimentar'
    ) THEN
        ALTER TABLE anamneses ADD COLUMN restricao_alimentar TEXT;
    END IF;
END $$;

-- =====================================================
-- ATUALIZAR REGISTROS EXISTENTES
-- =====================================================

-- Definir valores padrão para registros existentes
UPDATE anamneses SET sem_doencas = false WHERE sem_doencas IS NULL;
UPDATE anamneses SET problemas_respiratorios = false WHERE problemas_respiratorios IS NULL;
UPDATE anamneses SET problemas_renais = false WHERE problemas_renais IS NULL;
UPDATE anamneses SET problemas_hepaticos = false WHERE problemas_hepaticos IS NULL;
UPDATE anamneses SET transtorno_psiquiatrico = false WHERE transtorno_psiquiatrico IS NULL;
UPDATE anamneses SET gestante_lactante = false WHERE gestante_lactante IS NULL;
UPDATE anamneses SET sem_vicios = false WHERE sem_vicios IS NULL;
UPDATE anamneses SET cannabis = false WHERE cannabis IS NULL;
