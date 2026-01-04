# Guia de Branding - Ahoo

Este documento lista todas as referencias ao nome do app no codigo-fonte.
Use este guia para facilitar futuras mudancas de nome/marca.

## Nome Atual: Ahoo

## Arquivos com Referencias de Marca

### 1. Configuracao Principal (PRIORIDADE ALTA)
Arquivo central de configuracao - alterar aqui afeta varios componentes:

| Arquivo | Linha | Contexto |
|---------|-------|----------|
| `src/config/app.ts` | 14 | `name: 'Ahoo'` |
| `src/config/app.ts` | 15 | `shortName: 'Ahoo'` |
| `src/config/app.ts` | 16 | `description: 'Plataforma para gestao de cerimonias e comunidades'` |
| `src/config/app.ts` | 48 | `welcomeTitle: 'Bem-vindo ao Ahoo'` |
| `src/config/app.ts` | 50 | `footerText: '© 2024 Ahoo. Todos os direitos reservados.'` |

### 2. Componentes de Interface

| Arquivo | Contexto |
|---------|----------|
| `src/components/landing/FooterSection.tsx` | Logo alt text e copyright |
| `src/components/landing/FAQSection.tsx` | Mensagem WhatsApp |
| `src/components/shared/OnboardingTutorial.tsx` | Highlight do tutorial |
| `src/components/shared/WelcomeModal.tsx` | Subtitulo do modal |

### 3. Paginas

| Arquivo | Contexto |
|---------|----------|
| `src/pages/CasaPublica.tsx` | Footer da pagina publica |
| `src/pages/Depoimentos.tsx` | Texto de compartilhamento e autorizacao |
| `src/pages/Anamnese.tsx` | Autorizacao de uso de imagem |
| `src/pages/SobreNos.tsx` | Descricao do templo (se aplicavel) |

### 4. Tipos e Documentacao

| Arquivo | Contexto |
|---------|----------|
| `src/types/index.ts` | Comentario de documentacao |
| `supabase/RLS_POLICIES.md` | Documentacao de politicas |

### 5. Constantes

| Arquivo | Contexto |
|---------|----------|
| `src/constants/medicinas.ts` | Descricao das medicinas |

### 6. Arquivos de Spec (Documentacao Interna)
Estes arquivos sao documentacao interna e podem ser atualizados conforme necessario:

- `.kiro/specs/saas-multi-tenant/requirements.md`
- `.kiro/specs/index-redesign/design.md`
- `.kiro/specs/index-redesign/requirements.md`
- `.kiro/specs/lembretes-automaticos/design.md`
- `.kiro/specs/lembretes-automaticos/requirements.md`
- `.kiro/specs/historico-consagracoes/requirements.md`
- `.kiro/specs/portal-melhorias/design.md`
- `.kiro/specs/portal-melhorias/requirements.md`
- `.kiro/specs/portal-melhorias/tasks.md`

## Como Alterar o Nome

### Passo 1: Alterar Configuracao Central
Edite `src/config/app.ts` - este e o arquivo principal de configuracao.

### Passo 2: Buscar e Substituir
Execute uma busca global por:
- Nome atual (ex: "Ahoo")
- Variacoes com/sem acento
- Nome em minusculas

### Passo 3: Verificar Arquivos Especificos
Revise manualmente os arquivos listados acima.

### Passo 4: Assets
- `public/logo.png` - Logo principal
- `index.html` - Titulo da pagina e meta tags
- `public/manifest.json` (se existir) - Nome do PWA

### Passo 5: Servicos Externos
- Supabase: Variaveis de ambiente (APP_URL)
- Vercel: Configuracoes do projeto
- Mercado Pago: Nome da aplicacao

## Historico de Nomes
| Data | Nome Anterior | Nome Novo |
|------|---------------|-----------|
| 2024 | Consciencia Divinal | Ahoo |

---
Ultima atualizacao: Janeiro 2026
