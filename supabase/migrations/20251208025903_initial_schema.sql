-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Anamneses
CREATE TABLE IF NOT EXISTS public.anamneses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    nome_completo TEXT NOT NULL,
    data_nascimento DATE,
    telefone TEXT,
    contato_emergencia TEXT,
    pressao_alta BOOLEAN DEFAULT FALSE,
    problemas_cardiacos BOOLEAN DEFAULT FALSE,
    historico_convulsivo BOOLEAN DEFAULT FALSE,
    diabetes BOOLEAN DEFAULT FALSE,
    uso_medicamentos TEXT,
    uso_antidepressivos BOOLEAN DEFAULT FALSE,
    alergias TEXT,
    tabaco BOOLEAN DEFAULT FALSE,
    alcool BOOLEAN DEFAULT FALSE,
    outras_substancias TEXT,
    ja_consagrou BOOLEAN DEFAULT FALSE,
    como_foi_experiencia TEXT,
    intencao TEXT,
    termo_responsabilidade BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Medicinas
CREATE TABLE IF NOT EXISTS public.medicinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    descricao TEXT,
    beneficios TEXT,
    contraindicacoes TEXT,
    funcionamento TEXT,
    recomendacoes_pre_pos TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Cerimonias
CREATE TABLE IF NOT EXISTS public.cerimonias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data DATE NOT NULL,
    horario TIME NOT NULL,
    local TEXT NOT NULL,
    descricao TEXT,
    medicina_principal TEXT,
    vagas INTEGER,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Inscricoes
CREATE TABLE IF NOT EXISTS public.inscricoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cerimonia_id UUID REFERENCES public.cerimonias(id) NOT NULL,
    data_inscricao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, cerimonia_id)
);

-- 5. Diario
CREATE TABLE IF NOT EXISTS public.diario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    texto TEXT,
    audio_url TEXT,
    imagem_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Pos Cerimonia
CREATE TABLE IF NOT EXISTS public.pos_cerimonia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    como_se_sentiu TEXT,
    emocoes TEXT,
    visoes TEXT,
    dificuldades TEXT,
    sonhos TEXT,
    sugestoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FAQ
CREATE TABLE IF NOT EXISTS public.faq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cerimonias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_cerimonia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

-- Policies (Basic)
-- Anamneses: Users can insert their own. Users can view their own.
CREATE POLICY "Users can insert their own anamnese" ON public.anamneses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own anamnese" ON public.anamneses FOR SELECT USING (auth.uid() = user_id);

-- Medicinas: Public read
CREATE POLICY "Public read medicinas" ON public.medicinas FOR SELECT USING (true);

-- Cerimonias: Public read
CREATE POLICY "Public read cerimonias" ON public.cerimonias FOR SELECT USING (true);

-- Inscricoes: Users can insert their own, view their own.
CREATE POLICY "Users can insert their own inscricao" ON public.inscricoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own inscricoes" ON public.inscricoes FOR SELECT USING (auth.uid() = user_id);

-- Diario: Private to user
CREATE POLICY "Users can manage their own diary" ON public.diario FOR ALL USING (auth.uid() = user_id);

-- Pos Cerimonia: Private to user
CREATE POLICY "Users can manage their own pos_cerimonia" ON public.pos_cerimonia FOR ALL USING (auth.uid() = user_id);

-- FAQ: Public read
CREATE POLICY "Public read faq" ON public.faq FOR SELECT USING (true);
;
